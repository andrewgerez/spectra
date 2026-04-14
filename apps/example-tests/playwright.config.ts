import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: './src',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 1 : 0,
    workers: 1,
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: 'http://localhost:5173',
        viewport: { width: 1920, height: 1080 },
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        spectraOptions: {
            appUrl: 'http://localhost:5173',
            bridge: {
                port: 9222,
                connectTimeout: 5000,
                requestTimeout: 12000,
            },
        },
    },
    projects: [
        {
            name: 'chromium-tv',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
                launchOptions: {
                    args: [
                        '--disable-gpu-sandbox',
                        '--use-gl=angle',
                        '--use-angle=swiftshader',
                        '--disable-features=BackForwardCache',
                    ],
                },
            },
        },
    ],
});
