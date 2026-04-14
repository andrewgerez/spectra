import type { AppStateSnapshot, FocusedElement, RouteState, UITreeNode } from '@spectra/test-api';
export type RequestType = 'GET_SNAPSHOT' | 'GET_FOCUSED' | 'GET_TREE' | 'GET_ROUTE' | 'SKIP_SPLASH' | 'PING';
export interface RequestMessage {
    type: 'request';
    id: string;
    request: RequestType;
}
export type ResponsePayload = {
    request: 'GET_SNAPSHOT';
    data: AppStateSnapshot;
} | {
    request: 'GET_FOCUSED';
    data: FocusedElement | null;
} | {
    request: 'GET_TREE';
    data: UITreeNode;
} | {
    request: 'GET_ROUTE';
    data: RouteState;
} | {
    request: 'SKIP_SPLASH';
    data: {
        skipped: true;
    };
} | {
    request: 'PING';
    data: {
        pong: true;
        timestamp: number;
    };
};
export interface ResponseMessage {
    type: 'response';
    id: string;
    ok: true;
    payload: ResponsePayload;
}
export interface ErrorResponseMessage {
    type: 'response';
    id: string;
    ok: false;
    error: string;
}
export type EventMessage = {
    type: 'event';
    event: 'FOCUS_CHANGED';
    data: FocusedElement | null;
} | {
    type: 'event';
    event: 'ROUTE_CHANGED';
    data: RouteState;
} | {
    type: 'event';
    event: 'CONNECTED';
    data: {
        version: string;
    };
};
export type BridgeMessage = RequestMessage | ResponseMessage | ErrorResponseMessage | EventMessage;
export function parseMessage(raw: string): BridgeMessage {
    return JSON.parse(raw) as BridgeMessage;
}
export function serializeMessage(msg: BridgeMessage): string {
    return JSON.stringify(msg);
}
function generateId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function makeRequest(request: RequestType): RequestMessage {
    return {
        type: 'request',
        id: generateId(),
        request,
    };
}
