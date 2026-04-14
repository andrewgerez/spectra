export interface UITreeNode {
    id: string;
    type: string;
    focused: boolean;
    visible: boolean;
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    meta?: Record<string, unknown>;
    children: UITreeNode[];
}
export interface FocusedElement {
    id: string;
    path: string;
    text?: string;
    meta?: Record<string, unknown>;
}
export interface RouteState {
    pathname: string;
    hash: string;
    search: string;
}
export interface AppStateSnapshot {
    focused: FocusedElement | null;
    route: RouteState;
    tree: UITreeNode;
    timestamp: number;
}
export interface TestAPI {
    getFocused(): FocusedElement | null;
    getTree(): UITreeNode;
    getRoute(): RouteState;
    getSnapshot(): AppStateSnapshot;
    onFocusChange(cb: (focused: FocusedElement | null) => void): () => void;
    onRouteChange(cb: (route: RouteState) => void): () => void;
    skipSplash(): void;
    _registerSkipSplash(fn: (() => void) | null): void;
    _notifyFocusChange(focused: FocusedElement | null): void;
    _notifyRouteChange(route: RouteState): void;
    readonly version: string;
}
declare global {
    interface GlobalThis {
        __TEST_API__?: TestAPI;
    }
    interface Window {
        __TEST_API__: TestAPI;
        APP?: {
            children?: unknown[];
            [key: string]: unknown;
        };
    }
}
