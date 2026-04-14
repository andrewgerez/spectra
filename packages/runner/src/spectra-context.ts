import { BridgeServer } from '@spectra/bridge/server';
import type { BridgeServerOptions } from '@spectra/bridge/server';
import { PlaywrightDriver } from '@spectra/driver';
import type { Driver, TVKey, PressOptions, TypeTextOptions } from '@spectra/driver';
import type { Page } from 'playwright';
import type { SpectraContext } from './queries';
import { focused, focusedPath, focusedText, isVisible, getElement, currentRoute, getVisibleElements, } from './queries';
import { waitFor, waitForFocus, waitForRoute, } from './wait-for';
import type { WaitForOptions } from './wait-for';
import { assertFocused, assertFocusedText, assertVisible, assertNotVisible, assertRoute, assertMeta, } from './assertions';
export interface SpectraTestContextOptions {
    page?: Page;
    driver?: Driver;
    bridge?: BridgeServerOptions;
    appUrl?: string;
    bridgeReconnectTimeout?: number;
}
export type SpectraTestContextWithSharedBridgeOptions = Omit<SpectraTestContextOptions, 'bridge'> & {
    bridge: BridgeServer;
};
export class SpectraTestContext implements SpectraContext {
    readonly bridge: BridgeServer;
    readonly driver: Driver;
    private constructor(bridge: BridgeServer, driver: Driver, private readonly ownsBridge: boolean) {
        this.bridge = bridge;
        this.driver = driver;
    }
    static async create(opts: SpectraTestContextOptions = {}): Promise<SpectraTestContext> {
        const bridge = new BridgeServer(opts.bridge);
        const hasPageAndUrl = !!(opts.page && opts.appUrl);
        await bridge.start({ waitForFirstClient: !hasPageAndUrl });
        if (opts.page && opts.appUrl) {
            await opts.page.goto(opts.appUrl);
            await SpectraTestContext.waitForBridgeConnected(bridge, {
                timeout: opts.bridgeReconnectTimeout ??
                    opts.bridge?.connectTimeout ??
                    30000,
            });
        }
        const driver = opts.driver ??
            (opts.page
                ? new PlaywrightDriver(opts.page)
                : (() => {
                    throw new Error('[Spectra] SpectraTestContext.create() requires either `page` or `driver`');
                })());
        return new SpectraTestContext(bridge, driver, true);
    }
    static async createWithBridge(opts: SpectraTestContextWithSharedBridgeOptions): Promise<SpectraTestContext> {
        const { bridge, page } = opts;
        if (!page) {
            throw new Error('[Spectra] SpectraTestContext.createWithBridge() requires `page`');
        }
        const appUrl = opts.appUrl ?? 'http://localhost:5173';
        await page.goto(appUrl);
        await SpectraTestContext.waitForBridgeConnected(bridge, {
            timeout: opts.bridgeReconnectTimeout ?? 30000,
        });
        const driver = opts.driver ??
            new PlaywrightDriver(page);
        return new SpectraTestContext(bridge, driver, false);
    }
    static async waitForBridgeConnected(bridge: BridgeServer, opts: WaitForOptions = {}): Promise<void> {
        const timeout = opts.timeout ?? 30000;
        const interval = opts.interval ?? 50;
        await waitFor(() => bridge.isConnected, {
            timeout,
            interval,
            description: 'Spectra bridge WebSocket client to connect',
        });
    }
    async dispose(): Promise<void> {
        await this.driver.dispose?.();
        if (this.ownsBridge) {
            await this.bridge.stop();
        }
    }
    async skipSplash(opts: WaitForOptions = {}): Promise<void> {
        const timeout = opts.timeout ?? 10000;
        const interval = opts.interval ?? 50;
        const initial = await this.bridge.getRoute();
        if (initial.pathname !== '/splash') {
            return;
        }
        await waitFor(async () => {
            try {
                await this.bridge.skipSplash();
                const r = await this.bridge.getRoute();
                return r.pathname !== '/splash';
            }
            catch {
                return false;
            }
        }, { timeout, interval, description: 'splash to be skipped (leave /splash)' });
    }
    press(key: TVKey, opts?: PressOptions): Promise<void> {
        return this.driver.press(key, opts);
    }
    pressSequence(keys: TVKey[], opts?: PressOptions): Promise<void> {
        return this.driver.pressSequence(keys, opts);
    }
    typeText(text: string, opts?: TypeTextOptions): Promise<void> {
        const impl = this.driver.typeText;
        if (typeof impl !== 'function') {
            throw new TypeError('[Spectra] typeText is not supported by this driver (use Playwright E2E).');
        }
        return impl.call(this.driver, text, opts);
    }
    typeTextInField(elementId: string, text: string, opts?: TypeTextOptions): Promise<void> {
        const d = this.driver;
        if (d instanceof PlaywrightDriver) {
            return d.typeTextInField(elementId, text, opts);
        }
        const impl = d.typeTextInField;
        if (typeof impl === 'function') {
            return impl.call(d, elementId, text, opts);
        }
        throw new TypeError('[Spectra] typeTextInField is not supported by this driver (use Playwright E2E).');
    }
    focused() { return focused(this); }
    focusedPath() { return focusedPath(this); }
    focusedText() { return focusedText(this); }
    isVisible(id: string) { return isVisible(this, id); }
    getElement(id: string) { return getElement(this, id); }
    currentRoute() { return currentRoute(this); }
    getVisibleElements() { return getVisibleElements(this); }
    waitFor<T>(condition: () => T | Promise<T>, opts?: WaitForOptions) {
        return waitFor(condition, opts);
    }
    waitForFocus(predicate: Parameters<typeof waitForFocus>[1], opts?: WaitForOptions) {
        return waitForFocus(this.bridge, predicate, opts);
    }
    waitForRoute(predicate: Parameters<typeof waitForRoute>[1], opts?: WaitForOptions) {
        return waitForRoute(this.bridge, predicate, opts);
    }
    assertFocused(id: string, opts?: WaitForOptions) { return assertFocused(this, id, opts); }
    assertFocusedText(text: string, opts?: WaitForOptions) { return assertFocusedText(this, text, opts); }
    assertVisible(id: string, opts?: WaitForOptions) { return assertVisible(this, id, opts); }
    assertNotVisible(id: string, opts?: WaitForOptions) { return assertNotVisible(this, id, opts); }
    assertRoute(pathname: string, opts?: WaitForOptions) { return assertRoute(this, pathname, opts); }
    assertMeta(id: string, key: string, expected: unknown, opts?: WaitForOptions) { return assertMeta(this, id, key, expected, opts); }
}
