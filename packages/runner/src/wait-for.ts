import type { BridgeServer } from '@spectra/bridge/server';
import type { FocusedElement, RouteState } from '@spectra/test-api';
export interface WaitForOptions {
    timeout?: number;
    interval?: number;
    description?: string;
}
export async function waitFor<T>(condition: () => T | Promise<T>, opts: WaitForOptions = {}): Promise<T> {
    const timeout = opts.timeout ?? 5000;
    const interval = opts.interval ?? 50;
    const description = opts.description ?? 'condition to be true';
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        const result = await condition();
        if (result)
            return result;
        const slack = deadline - Date.now();
        await sleep(Math.max(1, Math.min(interval, slack)));
    }
    throw new Error(`[Spectra] Timed out after ${timeout}ms waiting for: ${description}`);
}
function raceWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms);
        promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
    });
}
export async function waitForFocus(bridge: BridgeServer, predicate: (focused: FocusedElement | null) => boolean, opts: WaitForOptions = {}): Promise<FocusedElement | null> {
    const timeout = opts.timeout ?? 5000;
    const interval = opts.interval ?? 50;
    const description = opts.description ?? 'focus to match predicate';
    const deadline = Date.now() + timeout;
    return new Promise<FocusedElement | null>((resolve, reject) => {
        let settled = false;
        let pollTimer: ReturnType<typeof setTimeout> | null = null;
        const settle = (value: FocusedElement | null) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            resolve(value);
        };
        const fail = () => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(new Error(`[Spectra] Timed out after ${timeout}ms waiting for ${description}`));
        };
        let unsub: (() => void) | null = null;
        const cleanup = () => {
            if (pollTimer) {
                clearTimeout(pollTimer);
                pollTimer = null;
            }
            if (unsub) {
                unsub();
                unsub = null;
            }
        };
        unsub = bridge.onFocusChange((focused) => {
            if (predicate(focused))
                settle(focused);
        });
        const poll = () => {
            if (settled)
                return;
            const remaining = deadline - Date.now();
            if (remaining <= 0) {
                fail();
                return;
            }
            const cap = Math.min(remaining, focusPollCapMs(remaining));
            raceWithTimeout(bridge.getFocused(), cap)
                .then((focused) => {
                if (settled)
                    return;
                if (predicate(focused)) {
                    settle(focused);
                }
                else {
                    const delay = Math.min(interval, deadline - Date.now());
                    if (delay > 0)
                        pollTimer = setTimeout(poll, delay);
                    else
                        fail();
                }
            })
                .catch(() => {
                if (settled)
                    return;
                const delay = Math.min(interval, deadline - Date.now());
                if (delay > 0)
                    pollTimer = setTimeout(poll, delay);
                else
                    fail();
            });
        };
        poll();
    });
}
export async function waitForRoute(bridge: BridgeServer, predicate: (route: RouteState) => boolean, opts: WaitForOptions = {}): Promise<RouteState> {
    const timeout = opts.timeout ?? 5000;
    const interval = opts.interval ?? 50;
    const description = opts.description ?? 'route to match predicate';
    const deadline = Date.now() + timeout;
    return new Promise<RouteState>((resolve, reject) => {
        let settled = false;
        let pollTimer: ReturnType<typeof setTimeout> | null = null;
        const settle = (value: RouteState) => {
            if (settled)
                return;
            settled = true;
            if (pollTimer)
                clearTimeout(pollTimer);
            resolve(value);
        };
        const fail = () => {
            if (settled)
                return;
            settled = true;
            reject(new Error(`[Spectra] Timed out after ${timeout}ms waiting for ${description}`));
        };
        const unsub = bridge.onRouteChange((route) => {
            if (predicate(route)) {
                unsub();
                settle(route);
            }
        });
        const poll = () => {
            if (settled)
                return;
            const remaining = deadline - Date.now();
            if (remaining <= 0) {
                unsub();
                fail();
                return;
            }
            raceWithTimeout(bridge.getRoute(), bridgePollCapMs(remaining)).then((route) => {
                if (settled)
                    return;
                if (predicate(route)) {
                    unsub();
                    settle(route);
                }
                else {
                    pollTimer = setTimeout(poll, interval);
                }
            }).catch(() => {
                if (settled)
                    return;
                pollTimer = setTimeout(poll, interval);
            });
        };
        poll();
    });
}
function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, Math.max(0, ms)));
}
function bridgePollCapMs(remaining: number): number {
    const r = Math.max(0, remaining);
    const share = Math.floor(r / 3.5);
    return Math.min(r, 1600, Math.max(280, share));
}
function focusPollCapMs(remaining: number): number {
    const r = Math.max(0, remaining);
    const share = Math.floor(r * 0.55);
    return Math.min(r, 6000, Math.max(2800, share));
}
