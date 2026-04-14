import { WebSocketServer, WebSocket } from 'ws';
import type { RequestType, RequestMessage, ResponseMessage, ErrorResponseMessage, EventMessage, } from '../protocol';
import { makeRequest, parseMessage, serializeMessage, } from '../protocol';
import type { AppStateSnapshot, FocusedElement, RouteState, UITreeNode, } from '@spectra/test-api';
type PendingRequest = {
    resolve: (data: unknown) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
};
export interface BridgeServerOptions {
    port?: number;
    requestTimeout?: number;
    connectTimeout?: number;
}
export interface BridgeServerStartOptions {
    waitForFirstClient?: boolean;
}
export class BridgeServer {
    private readonly port: number;
    private readonly requestTimeout: number;
    private readonly connectTimeout: number;
    private wss: WebSocketServer | null = null;
    private socket: WebSocket | null = null;
    private pending = new Map<string, PendingRequest>();
    private focusListeners = new Set<(f: FocusedElement | null) => void>();
    private routeListeners = new Set<(r: RouteState) => void>();
    constructor(opts: BridgeServerOptions = {}) {
        this.port = opts.port ?? 9222;
        this.requestTimeout = opts.requestTimeout ?? 2500;
        this.connectTimeout = opts.connectTimeout ?? 30000;
    }
    start(opts: BridgeServerStartOptions = {}): Promise<void> {
        const waitForFirstClient = opts.waitForFirstClient ?? true;
        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (err?: Error) => {
                if (settled)
                    return;
                settled = true;
                if (connectTimer)
                    clearTimeout(connectTimer);
                if (err)
                    reject(err);
                else
                    resolve();
            };
            const connectTimer = waitForFirstClient
                ? setTimeout(() => {
                    finish(new Error(`[Spectra Bridge] App did not connect within ${this.connectTimeout}ms. ` +
                        `Make sure VITE_SPECTRA_ENABLED=true and the app is running.`));
                }, this.connectTimeout)
                : null;
            this.wss = new WebSocketServer({ port: this.port }, () => {
                console.info(`[Spectra Bridge] Listening on ws://localhost:${this.port}`);
                if (!waitForFirstClient) {
                    finish();
                }
            });
            this.wss.on('error', (err) => {
                finish(err);
            });
            this.wss.on('connection', (ws) => {
                if (connectTimer)
                    clearTimeout(connectTimer);
                const previous = this.socket;
                this.socket = ws;
                if (previous && previous !== ws && previous.readyState === WebSocket.OPEN) {
                    try {
                        previous.close();
                    }
                    catch {
                    }
                }
                ws.on('message', (raw) => this.onMessage(raw.toString()));
                ws.on('close', () => {
                    if (this.socket !== ws)
                        return;
                    this.socket = null;
                    for (const [, p] of this.pending) {
                        clearTimeout(p.timer);
                        p.reject(new Error('[Spectra Bridge] App disconnected'));
                    }
                    this.pending.clear();
                });
                if (waitForFirstClient) {
                    finish();
                }
            });
        });
    }
    stop(): Promise<void> {
        return new Promise((resolve) => {
            this.socket?.close();
            this.socket = null;
            this.wss?.close(() => resolve());
            this.wss = null;
        });
    }
    get isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
    async getSnapshot(): Promise<AppStateSnapshot> {
        return this.send<AppStateSnapshot>('GET_SNAPSHOT');
    }
    async getFocused(): Promise<FocusedElement | null> {
        return this.send<FocusedElement | null>('GET_FOCUSED');
    }
    async getTree(): Promise<UITreeNode> {
        return this.send<UITreeNode>('GET_TREE');
    }
    async getRoute(): Promise<RouteState> {
        return this.send<RouteState>('GET_ROUTE');
    }
    async skipSplash(): Promise<void> {
        await this.send<{
            skipped: true;
        }>('SKIP_SPLASH');
    }
    async ping(): Promise<void> {
        await this.send<{
            pong: true;
        }>('PING');
    }
    onFocusChange(cb: (f: FocusedElement | null) => void): () => void {
        this.focusListeners.add(cb);
        return () => this.focusListeners.delete(cb);
    }
    onRouteChange(cb: (r: RouteState) => void): () => void {
        this.routeListeners.add(cb);
        return () => this.routeListeners.delete(cb);
    }
    private send<T>(request: RequestType): Promise<T> {
        if (!this.isConnected) {
            return Promise.reject(new Error('[Spectra Bridge] Not connected to app'));
        }
        const msg: RequestMessage = makeRequest(request);
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(msg.id);
                reject(new Error(`[Spectra Bridge] Request "${request}" timed out after ${this.requestTimeout}ms`));
            }, this.requestTimeout);
            this.pending.set(msg.id, {
                resolve: resolve as (d: unknown) => void,
                reject,
                timer,
            });
            this.socket!.send(serializeMessage(msg));
        });
    }
    private onMessage(raw: string): void {
        let msg: ReturnType<typeof parseMessage>;
        try {
            msg = parseMessage(raw);
        }
        catch {
            console.warn('[Spectra Bridge] Failed to parse message:', raw);
            return;
        }
        if (msg.type === 'response') {
            const resp = msg as ResponseMessage | ErrorResponseMessage;
            const pending = this.pending.get(resp.id);
            if (!pending)
                return;
            clearTimeout(pending.timer);
            this.pending.delete(resp.id);
            if (resp.ok) {
                pending.resolve((resp as ResponseMessage).payload.data);
            }
            else {
                pending.reject(new Error((resp as ErrorResponseMessage).error));
            }
            return;
        }
        if (msg.type === 'event') {
            const event = msg as EventMessage;
            if (event.event === 'FOCUS_CHANGED') {
                for (const cb of this.focusListeners)
                    cb(event.data);
            }
            if (event.event === 'ROUTE_CHANGED') {
                for (const cb of this.routeListeners)
                    cb(event.data);
            }
        }
    }
}
