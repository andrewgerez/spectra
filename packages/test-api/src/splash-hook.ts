import { onCleanup } from 'solid-js';
export function createSpectraSplashSkip(skipFn: () => void): void {
    if (typeof globalThis.window === 'undefined')
        return;
    const api = globalThis.window.__TEST_API__;
    if (!api)
        return;
    api._registerSkipSplash(skipFn);
    onCleanup(() => {
        api._registerSkipSplash(null);
    });
}
