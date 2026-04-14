import { test } from '../fixtures';
const APP_SETTLE_MS = 2000;

async function waitAppSettled(): Promise<void> {
    await new Promise((r) => setTimeout(r, APP_SETTLE_MS));
}

test.describe('IndexPage (logged out)', () => {
    test.beforeEach(async ({ spectra }) => {
        await spectra.assertRoute('/', { timeout: 6000 });
        await spectra.assertFocused('index-login-btn', {
            timeout: 5000,
            description: 'Index ready: login button focused before settle',
        });
        await waitAppSettled();
    });

    test('lands on / after splash', async ({ spectra }) => {
        await spectra.assertRoute('/', { timeout: 4000 });
    });
});
