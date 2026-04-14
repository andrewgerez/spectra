export type TVKey = 'Up' | 'Down' | 'Left' | 'Right' | 'Enter' | 'Back' | 'Backspace' | 'Play' | 'Pause' | 'PlayPause' | 'FastForward' | 'FastForward10' | 'Rewind' | 'Rewind10' | 'Stop' | 'Menu' | 'Key0' | 'Key1' | 'Key2' | 'Key3' | 'Key4' | 'Key5' | 'Key6' | 'Key7' | 'Key8' | 'Key9';
export interface PressOptions {
    delay?: number;
}
export interface TypeTextOptions {
    delay?: number;
    timeout?: number;
}
export interface Driver {
    press(key: TVKey, opts?: PressOptions): Promise<void>;
    pressSequence(keys: TVKey[], opts?: PressOptions): Promise<void>;
    typeText?(text: string, opts?: TypeTextOptions): Promise<void>;
    typeTextInField?(elementId: string, text: string, opts?: TypeTextOptions): Promise<void>;
    dispose?(): Promise<void>;
}
