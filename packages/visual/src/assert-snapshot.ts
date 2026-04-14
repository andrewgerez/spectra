import type { Page } from 'playwright';
import { captureCanvas, loadBaseline, saveBaseline, saveDiff, type ScreenshotOptions, type SnapshotOptions, } from './screenshot';
import { diffImages, type DiffOptions } from './diff';
export interface AssertSnapshotOptions extends Partial<ScreenshotOptions>, SnapshotOptions, DiffOptions {
    page: Page;
}
export async function assertSnapshot(opts: AssertSnapshotOptions): Promise<void> {
    const current = await captureCanvas({
        page: opts.page,
        selector: opts.selector,
        clip: opts.clip,
    });
    const snapshotOpts: SnapshotOptions = {
        name: opts.name,
        snapshotDir: opts.snapshotDir,
    };
    const baseline = await loadBaseline(snapshotOpts);
    const isUpdate = process.env['UPDATE_SNAPSHOTS'] === 'true';
    if (!baseline || isUpdate) {
        await saveBaseline(current, snapshotOpts);
        if (isUpdate) {
            console.info(`[Spectra Visual] Snapshot updated: ${opts.name}`);
        }
        else {
            console.info(`[Spectra Visual] Baseline created: ${opts.name}`);
        }
        return;
    }
    const result = await diffImages(baseline, current, opts);
    if (!result.match) {
        await saveDiff(result.diffImage, snapshotOpts);
        throw new Error(`[Spectra Visual] Snapshot mismatch for "${opts.name}": ` +
            `${result.diffPixels} pixels differ (${(result.diffRatio * 100).toFixed(2)}%). ` +
            `Diff saved to ${opts.snapshotDir ?? '__snapshots__'}/${opts.name}.diff.png. ` +
            `Run with UPDATE_SNAPSHOTS=true to accept the new baseline.`);
    }
}
