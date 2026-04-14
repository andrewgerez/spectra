import type { Page } from 'playwright';
import type { Driver, PressOptions, TVKey, TypeTextOptions } from '../types';
const KEY_MAP: Record<TVKey, string> = {
    Up: 'ArrowUp',
    Down: 'ArrowDown',
    Left: 'ArrowLeft',
    Right: 'ArrowRight',
    Enter: 'Enter',
    Back: 'Escape',
    Backspace: 'Backspace',
    Play: 'p',
    Pause: 'a',
    PlayPause: 't',
    FastForward: 'f',
    FastForward10: 'd',
    Rewind: 'r',
    Rewind10: 'e',
    Stop: 's',
    Menu: 'Escape',
    Key0: '0',
    Key1: '1',
    Key2: '2',
    Key3: '3',
    Key4: '4',
    Key5: '5',
    Key6: '6',
    Key7: '7',
    Key8: '8',
    Key9: '9',
};
export class PlaywrightDriver implements Driver {
    constructor(private readonly page: Page) { }
    async press(key: TVKey, opts: PressOptions = {}): Promise<void> {
        const pwKey = KEY_MAP[key];
        if (!pwKey)
            throw new Error(`[PlaywrightDriver] Unknown key: ${key}`);
        await this.page.keyboard.press(pwKey, { delay: opts.delay ?? 0 });
    }
    async pressSequence(keys: TVKey[], opts: PressOptions = {}): Promise<void> {
        for (const key of keys) {
            await this.press(key, opts);
        }
    }
    async typeText(text: string, opts: TypeTextOptions = {}): Promise<void> {
        await this.page.keyboard.type(text, { delay: opts.delay ?? 0 });
    }
    async typeTextInField(elementId: string, text: string, opts: TypeTextOptions = {}): Promise<void> {
        const timeout = opts.timeout ?? 10000;
        const locator = this.page.locator(`#${elementId}`);
        await locator.waitFor({ state: 'attached', timeout });
        await this.page.evaluate(({ id, value }) => {
            const el = document.getElementById(id);
            if (!(el instanceof HTMLInputElement)) {
                throw new TypeError(`[PlaywrightDriver] #${id} missing or not HTMLInputElement`);
            }
            el.focus({ preventScroll: true });
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, { id: elementId, value: text });
    }
}
