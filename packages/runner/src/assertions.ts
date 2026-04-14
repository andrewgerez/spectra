import type { SpectraContext } from './queries';
import { focused, isVisible, getElement, currentRoute, } from './queries';
import { waitForFocus, waitForRoute, type WaitForOptions } from './wait-for';
import type { BridgeServer } from '@spectra/bridge/server';
export async function assertFocused(ctx: SpectraContext, expectedId: string, opts: WaitForOptions = {}): Promise<void> {
    await waitForFocus(ctx.bridge, (f) => f?.id === expectedId, { description: `element "${expectedId}" to be focused`, ...opts });
}
export async function assertFocusedText(ctx: SpectraContext, expectedText: string, opts: WaitForOptions = {}): Promise<void> {
    await waitForFocus(ctx.bridge, (f) => f?.text === expectedText, { description: `focused text to be "${expectedText}"`, ...opts });
}
export async function assertVisible(ctx: SpectraContext, id: string, opts: WaitForOptions = {}): Promise<void> {
    const timeout = opts.timeout ?? 5000;
    const interval = opts.interval ?? 50;
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (await isVisible(ctx, id))
            return;
        await sleep(interval);
    }
    throw new Error(`[Spectra] Expected element "${id}" to be visible, but it was not found or invisible after ${timeout}ms`);
}
export async function assertNotVisible(ctx: SpectraContext, id: string, opts: WaitForOptions = {}): Promise<void> {
    const timeout = opts.timeout ?? 5000;
    const interval = opts.interval ?? 50;
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        const visible = await isVisible(ctx, id);
        if (!visible)
            return;
        await sleep(interval);
    }
    throw new Error(`[Spectra] Expected element "${id}" to NOT be visible, but it was still visible after ${timeout}ms`);
}
export async function assertRoute(ctx: SpectraContext, expectedPathname: string, opts: WaitForOptions = {}): Promise<void> {
    await waitForRoute(ctx.bridge, (r) => r.pathname === expectedPathname, { description: `route to be "${expectedPathname}"`, ...opts });
}
export async function assertMeta(ctx: SpectraContext, id: string, key: string, expected: unknown, opts: WaitForOptions = {}): Promise<void> {
    const timeout = opts.timeout ?? 5000;
    const interval = opts.interval ?? 50;
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        const el = await getElement(ctx, id);
        if (el?.meta?.[key] === expected)
            return;
        await sleep(interval);
    }
    const el = await getElement(ctx, id);
    const actual = el?.meta?.[key];
    throw new Error(`[Spectra] Element "${id}" meta["${key}"]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}
