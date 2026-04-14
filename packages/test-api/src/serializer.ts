import type { UITreeNode, FocusedElement } from './types';
interface LightningNode {
    id?: string;
    _id?: string;
    name?: string;
    lng?: {
        id?: number;
    };
    states?: {
        has: (s: string) => boolean;
    } | string[];
    alpha?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    _text?: string;
    children?: LightningNode[];
    _testMeta?: Record<string, unknown>;
}
function isFocused(node: LightningNode): boolean {
    const { states } = node;
    if (!states)
        return false;
    if (typeof (states as {
        has: (s: string) => boolean;
    }).has === 'function') {
        return (states as {
            has: (s: string) => boolean;
        }).has('focus');
    }
    if (Array.isArray(states)) {
        return states.includes('focus');
    }
    return false;
}
function isVisible(node: LightningNode): boolean {
    return (node.alpha ?? 1) > 0;
}
function nodeId(node: LightningNode, index: number): string {
    const str = node.id ?? node._id;
    if (str && str !== '0' && str !== '')
        return str;
    if (node.name)
        return node.name;
    return `node__${node.lng?.id ?? index}`;
}
function nodeType(node: LightningNode): string {
    if (node.name)
        return node.name;
    return node.text !== undefined ? 'Text' : 'View';
}
export function serializeNode(node: LightningNode, index = 0): UITreeNode {
    const children = (node.children ?? []).map((child, i) => serializeNode(child, i));
    return {
        id: nodeId(node, index),
        type: nodeType(node),
        focused: isFocused(node),
        visible: isVisible(node),
        text: node.text ?? node._text,
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.width ?? 0,
        height: node.height ?? 0,
        meta: node._testMeta,
        children,
    };
}
export function serializeAppTree(): UITreeNode {
    const g = globalThis as typeof globalThis & { APP?: LightningNode };
    const root = g.APP ?? null;
    if (root === null) {
        return {
            id: '__root__',
            type: 'Root',
            focused: false,
            visible: false,
            x: 0, y: 0, width: 0, height: 0,
            children: [],
        };
    }
    return serializeNode(root);
}
export function findFocused(node: UITreeNode, path = ''): FocusedElement | null {
    let best: FocusedElement | null = null;
    let bestDepth = -1;
    const walk = (n: UITreeNode, p: string, depth: number): void => {
        const currentPath = p ? `${p}.${n.id}` : n.id;
        if (n.focused && depth > bestDepth) {
            bestDepth = depth;
            best = {
                id: n.id,
                path: currentPath,
                text: n.text,
                meta: n.meta,
            };
        }
        for (const child of n.children) {
            walk(child, currentPath, depth + 1);
        }
    };
    walk(node, path, 0);
    return best;
}
