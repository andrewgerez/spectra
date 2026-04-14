import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import type { Page } from 'playwright';
export interface ScreenshotOptions {
    page: Page;
    selector?: string;
    clip?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export async function captureCanvas(opts: ScreenshotOptions): Promise<Buffer> {
    const selector = opts.selector ?? '#app canvas';
    const element = await opts.page.$(selector);
    if (!element) {
        throw new Error(`[Spectra Visual] Canvas element not found: "${selector}". ` +
            `Make sure the app is fully loaded.`);
    }
    const screenshotBuffer = await element.screenshot({
        type: 'png',
        ...(opts.clip ? { clip: opts.clip } : {}),
    });
    return screenshotBuffer;
}
export interface SnapshotOptions {
    snapshotDir?: string;
    name: string;
}
export async function loadBaseline(opts: SnapshotOptions): Promise<Buffer | null> {
    const dir = opts.snapshotDir ?? '__snapshots__';
    const path = join(dir, `${opts.name}.png`);
    try {
        await access(path);
        return await readFile(path);
    }
    catch {
        return null;
    }
}
export async function saveBaseline(data: Buffer, opts: SnapshotOptions): Promise<void> {
    const dir = opts.snapshotDir ?? '__snapshots__';
    const path = join(dir, `${opts.name}.png`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
}
export async function saveDiff(data: Buffer, opts: SnapshotOptions): Promise<void> {
    const dir = opts.snapshotDir ?? '__snapshots__';
    const path = join(dir, `${opts.name}.diff.png`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
}
