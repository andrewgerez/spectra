import type { SpectraFixtureOptions } from '@spectra/runner';
declare module '@playwright/test' {
    interface PlaywrightTestOptions {
        spectraOptions?: SpectraFixtureOptions;
    }
}
