import { test as base, expect } from '@playwright/test';
import { BridgeServer } from '@spectra/bridge/server';
import { SpectraTestContext } from './spectra-context';
import type { SpectraTestContextOptions } from './spectra-context';
export type SpectraFixtureOptions = SpectraTestContextOptions;
export type SpectraFixtures = {
    spectra: SpectraTestContext;
    spectraOptions: SpectraFixtureOptions;
};
export type SpectraWorkerFixtures = {
    _spectraBridgeServer: BridgeServer;
};
export const test = base.extend<SpectraFixtures, SpectraWorkerFixtures>({
    spectraOptions: [{ appUrl: 'http://localhost:5173' }, { option: true }],
    _spectraBridgeServer: [
        async ({}, use, workerInfo) => {
            const useOpts = workerInfo.project.use as {
                spectraOptions?: SpectraFixtureOptions;
            };
            const bridge = new BridgeServer(useOpts.spectraOptions?.bridge);
            await bridge.start({ waitForFirstClient: false });
            await use(bridge);
            await bridge.stop();
        },
        { scope: 'worker' },
    ],
    spectra: async ({ page, spectraOptions, _spectraBridgeServer }, use) => {
        const appUrl = spectraOptions.appUrl ?? 'http://localhost:5173';
        const { bridge: bridgeServerOpts, ...spectraRest } = spectraOptions;
        const ctx = await SpectraTestContext.createWithBridge({
            ...spectraRest,
            page,
            appUrl,
            bridge: _spectraBridgeServer,
            bridgeReconnectTimeout: bridgeServerOpts?.connectTimeout,
        });
        await ctx.skipSplash();
        await use(ctx);
        await new Promise((r) => setTimeout(r, 2000));
        await ctx.dispose();
    },
});
export { expect };
