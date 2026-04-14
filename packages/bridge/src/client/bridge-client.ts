import type { RequestMessage, ResponseMessage, ErrorResponseMessage, EventMessage, } from '../protocol';
import { parseMessage, serializeMessage } from '../protocol';
import { SPECTRA_VERSION } from '@spectra/test-api';
export interface BridgeClientOptions {
    url?: string;
    reconnectDelay?: number;
}
export class BridgeClient {
    private readonly url: string;
    private readonly reconnectDelay: number;
    private ws: WebSocket | null = null;
    private destroyed = false;
    private unsubFocus: (() => void) | null = null;
    private unsubRoute: (() => void) | null = null;
    constructor(opts: BridgeClientOptions = {}) {
        this.url = opts.url ?? 'ws://localhost:9222';
        this.reconnectDelay = opts.reconnectDelay ?? 2000;
    }
    start(): void {
        this.connect();
    }
    stop(): void {
        this.destroyed = true;
        this.unsubFocus?.();
        this.unsubRoute?.();
        this.ws?.close();
        this.ws = null;
    }
    private connect(): void {
        if (this.destroyed)
            return;
        let ws: WebSocket;
        try {
            ws = new WebSocket(this.url);
        }
        catch {
            this.scheduleReconnect();
            return;
        }
        this.ws = ws;
        ws.onopen = () => {
            console.info(`[Spectra Bridge Client] Connected to ${this.url}`);
            this.pushEvent({
                type: 'event',
                event: 'CONNECTED',
                data: { version: SPECTRA_VERSION },
            });
            this.subscribeToAppEvents();
        };
        ws.onmessage = (ev) => {
            this.handleMessage(ev.data as string);
        };
        ws.onclose = () => {
            if (this.ws !== ws)
                return;
            this.unsubFocus?.();
            this.unsubRoute?.();
            this.ws = null;
            this.scheduleReconnect();
        };
        ws.onerror = () => {
        };
    }
    private scheduleReconnect(): void {
        if (this.destroyed)
            return;
        setTimeout(() => this.connect(), this.reconnectDelay);
    }
    private subscribeToAppEvents(): void {
        const api = window.__TEST_API__;
        if (!api)
            return;
        this.unsubFocus?.();
        this.unsubRoute?.();
        this.unsubFocus = api.onFocusChange((focused) => {
            this.pushEvent({ type: 'event', event: 'FOCUS_CHANGED', data: focused });
        });
        this.unsubRoute = api.onRouteChange((route) => {
            this.pushEvent({ type: 'event', event: 'ROUTE_CHANGED', data: route });
        });
    }
    private pushEvent(event: EventMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(serializeMessage(event));
        }
    }
    private handleMessage(raw: string): void {
        let msg: ReturnType<typeof parseMessage>;
        try {
            msg = parseMessage(raw);
        }
        catch {
            return;
        }
        if (msg.type !== 'request')
            return;
        const req = msg as RequestMessage;
        const api = window.__TEST_API__;
        if (!api) {
            this.sendError(req.id, 'TEST_API not installed');
            return;
        }
        try {
            switch (req.request) {
                case 'GET_SNAPSHOT': {
                    const data = api.getSnapshot();
                    this.sendResponse(req.id, 'GET_SNAPSHOT', data);
                    break;
                }
                case 'GET_FOCUSED': {
                    const data = api.getFocused();
                    this.sendResponse(req.id, 'GET_FOCUSED', data);
                    break;
                }
                case 'GET_TREE': {
                    const data = api.getTree();
                    this.sendResponse(req.id, 'GET_TREE', data);
                    break;
                }
                case 'GET_ROUTE': {
                    const data = api.getRoute();
                    this.sendResponse(req.id, 'GET_ROUTE', data);
                    break;
                }
                case 'SKIP_SPLASH': {
                    api.skipSplash();
                    this.sendResponse(req.id, 'SKIP_SPLASH', { skipped: true });
                    break;
                }
                case 'PING': {
                    this.sendResponse(req.id, 'PING', { pong: true, timestamp: Date.now() });
                    break;
                }
                default: {
                    this.sendError(req.id, `Unknown request: ${(req as RequestMessage).request}`);
                }
            }
        }
        catch (err) {
            this.sendError(req.id, String(err));
        }
    }
    private sendResponse(id: string, request: string, data: unknown): void {
        const msg: ResponseMessage = {
            type: 'response',
            id,
            ok: true,
            payload: { request, data } as ResponseMessage['payload'],
        };
        this.ws?.send(serializeMessage(msg));
    }
    private sendError(id: string, error: string): void {
        const msg: ErrorResponseMessage = {
            type: 'response',
            id,
            ok: false,
            error,
        };
        this.ws?.send(serializeMessage(msg));
    }
}
let _client: BridgeClient | null = null;
export function maybeStartBridgeClient(opts?: BridgeClientOptions): void {
    const im = import.meta as ImportMeta & {
        env?: { VITE_SPECTRA_ENABLED?: string };
    };
    const enabled = (typeof import.meta !== 'undefined' &&
        im.env?.VITE_SPECTRA_ENABLED === 'true') ||
        (typeof process !== 'undefined' &&
            process.env?.VITE_SPECTRA_ENABLED === 'true');
    if (!enabled)
        return;
    if (_client)
        return;
    _client = new BridgeClient(opts);
    _client.start();
}
