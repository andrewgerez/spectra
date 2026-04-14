import type { Driver, PressOptions, TVKey } from '../types';
const KEYBOARD_KEY_MAP: Record<TVKey, {
    key: string;
    keyCode: number;
}> = {
    Up: { key: 'ArrowUp', keyCode: 38 },
    Down: { key: 'ArrowDown', keyCode: 40 },
    Left: { key: 'ArrowLeft', keyCode: 37 },
    Right: { key: 'ArrowRight', keyCode: 39 },
    Enter: { key: 'Enter', keyCode: 13 },
    Back: { key: 'Escape', keyCode: 27 },
    Backspace: { key: 'Backspace', keyCode: 8 },
    Play: { key: 'p', keyCode: 80 },
    Pause: { key: 'a', keyCode: 65 },
    PlayPause: { key: 't', keyCode: 84 },
    FastForward: { key: 'f', keyCode: 70 },
    FastForward10: { key: 'd', keyCode: 68 },
    Rewind: { key: 'r', keyCode: 82 },
    Rewind10: { key: 'e', keyCode: 69 },
    Stop: { key: 's', keyCode: 83 },
    Menu: { key: 'Escape', keyCode: 27 },
    Key0: { key: '0', keyCode: 48 },
    Key1: { key: '1', keyCode: 49 },
    Key2: { key: '2', keyCode: 50 },
    Key3: { key: '3', keyCode: 51 },
    Key4: { key: '4', keyCode: 52 },
    Key5: { key: '5', keyCode: 53 },
    Key6: { key: '6', keyCode: 54 },
    Key7: { key: '7', keyCode: 55 },
    Key8: { key: '8', keyCode: 56 },
    Key9: { key: '9', keyCode: 57 },
};
export class KeyboardDriver implements Driver {
    private readonly target: EventTarget;
    constructor(target: EventTarget = document) {
        this.target = target;
    }
    async press(key: TVKey, opts: PressOptions = {}): Promise<void> {
        const mapping = KEYBOARD_KEY_MAP[key];
        if (!mapping)
            throw new Error(`[KeyboardDriver] Unknown key: ${key}`);
        const init: KeyboardEventInit = {
            key: mapping.key,
            keyCode: mapping.keyCode,
            which: mapping.keyCode,
            bubbles: true,
            cancelable: true,
        };
        this.target.dispatchEvent(new KeyboardEvent('keydown', init));
        if (opts.delay) {
            await sleep(opts.delay);
        }
        this.target.dispatchEvent(new KeyboardEvent('keyup', init));
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
