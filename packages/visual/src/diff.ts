import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
export interface DiffResult {
    diffPixels: number;
    diffRatio: number;
    diffImage: Buffer;
    match: boolean;
}
export interface DiffOptions {
    threshold?: number;
    pixelThreshold?: number;
    includeAA?: boolean;
}
export async function diffImages(baseline: Buffer, current: Buffer, opts: DiffOptions = {}): Promise<DiffResult> {
    const baselinePng = PNG.sync.read(baseline);
    const currentPng = PNG.sync.read(current);
    const { width, height } = baselinePng;
    if (currentPng.width !== width || currentPng.height !== height) {
        throw new Error(`[Spectra Visual] Image dimensions differ: ` +
            `baseline is ${width}×${height}, current is ${currentPng.width}×${currentPng.height}. ` +
            `Delete the baseline to regenerate it.`);
    }
    const diffPng = new PNG({ width, height });
    const diffPixels = pixelmatch(baselinePng.data, currentPng.data, diffPng.data, width, height, {
        threshold: opts.pixelThreshold ?? 0.1,
        includeAA: opts.includeAA ?? false,
    });
    const totalPixels = width * height;
    const diffRatio = diffPixels / totalPixels;
    const maxRatio = opts.threshold ?? 0.01;
    return {
        diffPixels,
        diffRatio,
        diffImage: PNG.sync.write(diffPng),
        match: diffRatio <= maxRatio,
    };
}
