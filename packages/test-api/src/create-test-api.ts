import { routeFromLocation } from './location-route';
import { serializeAppTree, findFocused } from './serializer';
import type { TestAPI, FocusedElement, RouteState, AppStateSnapshot, UITreeNode, } from './types';
export const SPECTRA_VERSION = '0.1.0';
export function createTestAPI(): TestAPI {
    const focusListeners = new Set<(f: FocusedElement | null) => void>();
    const routeListeners = new Set<(r: RouteState) => void>();
    let _focused: FocusedElement | null = null;
    let _route: RouteState = routeFromLocation();
    let _skipSplashFn: (() => void) | null = null;
    const api: TestAPI = {
        version: SPECTRA_VERSION,
        getFocused(): FocusedElement | null {
            return _focused ?? findFocused(serializeAppTree());
        },
        getTree(): UITreeNode {
            return serializeAppTree();
        },
        getRoute(): RouteState {
            return routeFromLocation();
        },
        getSnapshot(): AppStateSnapshot {
            const tree = serializeAppTree();
            const focused = _focused ?? findFocused(tree);
            return {
                focused,
                route: routeFromLocation(),
                tree,
                timestamp: Date.now(),
            };
        },
        onFocusChange(cb) {
            focusListeners.add(cb);
            return () => focusListeners.delete(cb);
        },
        onRouteChange(cb) {
            routeListeners.add(cb);
            return () => routeListeners.delete(cb);
        },
        skipSplash() {
            if (_skipSplashFn) {
                _skipSplashFn();
            }
            else {
                console.warn('[Spectra] skipSplash called before _registerSkipSplash — splash hook not mounted yet');
            }
        },
        _registerSkipSplash(fn) {
            _skipSplashFn = fn ?? null;
        },
        _notifyFocusChange(focused) {
            _focused = focused;
            for (const cb of focusListeners) {
                try {
                    cb(focused);
                }
                catch {
                }
            }
        },
        _notifyRouteChange(route) {
            _route = route;
            for (const cb of routeListeners) {
                try {
                    cb(route);
                }
                catch {
                }
            }
        },
    };
    return api;
}
export function maybeInstallTestAPI(): void {
    const im = import.meta as ImportMeta & {
        env?: { VITE_SPECTRA_ENABLED?: string };
    };
    const enabled = im.env?.VITE_SPECTRA_ENABLED === 'true';
    if (!enabled)
        return;
    const g = globalThis as typeof globalThis & { __TEST_API__?: TestAPI };
    if (g.__TEST_API__) {
        console.warn('[Spectra] TEST_API already installed — skipping duplicate.');
        return;
    }
    g.__TEST_API__ = createTestAPI();
    console.info(`[Spectra] TEST_API v${SPECTRA_VERSION} installed.`);
}
