import { execFile } from 'child_process';
import { promisify } from 'util';
import type { Driver, PressOptions, TVKey } from '../types';
const execFileAsync = promisify(execFile);
const ADB_KEY_MAP: Record<TVKey, number> = {
    Up: 19,
    Down: 20,
    Left: 21,
    Right: 22,
    Enter: 23,
    Back: 4,
    Backspace: 67,
    Play: 126,
    Pause: 127,
    PlayPause: 85,
    FastForward: 87,
    FastForward10: 87,
    Rewind: 89,
    Rewind10: 89,
    Stop: 86,
    Menu: 82,
    Key0: 7,
    Key1: 8,
    Key2: 9,
    Key3: 10,
    Key4: 11,
    Key5: 12,
    Key6: 13,
    Key7: 14,
    Key8: 15,
    Key9: 16,
};
export interface AdbDriverOptions {
    deviceId?: string;
    adbPath?: string;
}
export class AdbDriver implements Driver {
    private readonly deviceId: string | undefined;
    private readonly adbPath: string;
    constructor(opts: AdbDriverOptions = {}) {
        this.deviceId = opts.deviceId;
        this.adbPath = opts.adbPath ?? 'adb';
    }
    async press(key: TVKey, opts: PressOptions = {}): Promise<void> {
        const keyCode = ADB_KEY_MAP[key];
        if (keyCode === undefined) {
            throw new Error(`[AdbDriver] Unknown key: ${key}`);
        }
        const args: string[] = [];
        if (this.deviceId)
            args.push('-s', this.deviceId);
        args.push('shell', 'input', 'keyevent', String(keyCode));
        await execFileAsync(this.adbPath, args);
        if (opts.delay) {
            await sleep(opts.delay);
        }
    }
    async pressSequence(keys: TVKey[], opts: PressOptions = {}): Promise<void> {
        for (const key of keys) {
            await this.press(key, opts);
        }
    }
}
function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}
