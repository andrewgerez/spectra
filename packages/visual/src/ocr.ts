import Tesseract from 'tesseract.js';
export interface OcrOptions {
    lang?: string;
    preprocess?: 'none' | 'threshold';
}
export interface OcrResult {
    text: string;
    confidence: number;
}
let _worker: Tesseract.Worker | null = null;
async function getWorker(lang: string): Promise<Tesseract.Worker> {
    if (!_worker) {
        _worker = await Tesseract.createWorker(lang);
    }
    return _worker;
}
export async function extractText(imageBuffer: Buffer, opts: OcrOptions = {}): Promise<OcrResult> {
    const lang = opts.lang ?? 'por+eng';
    const worker = await getWorker(lang);
    const { data } = await worker.recognize(imageBuffer);
    return {
        text: data.text.trim(),
        confidence: data.confidence,
    };
}
export async function terminateOcr(): Promise<void> {
    if (_worker) {
        await _worker.terminate();
        _worker = null;
    }
}
