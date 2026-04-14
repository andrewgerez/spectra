import type { BridgeServer } from '@spectra/bridge/server';
import type { UITreeNode } from '@spectra/test-api';
export interface SpectraContext {
    bridge: BridgeServer;
}
export async function focused(ctx: SpectraContext): Promise<string | null> {
    const f = await ctx.bridge.getFocused();
    return f?.id ?? null;
}
export async function focusedPath(ctx: SpectraContext): Promise<string | null> {
    const f = await ctx.bridge.getFocused();
    return f?.path ?? null;
}
export async function focusedText(ctx: SpectraContext): Promise<string | undefined> {
    const f = await ctx.bridge.getFocused();
    return f?.text;
}
function findNode(node: UITreeNode, id: string): UITreeNode | null {
    if (node.id === id)
        return node;
    for (const child of node.children) {
        const found = findNode(child, id);
        if (found)
            return found;
    }
    return null;
}
function collectAll(node: UITreeNode): UITreeNode[] {
    const result: UITreeNode[] = [node];
    for (const child of node.children) {
        result.push(...collectAll(child));
    }
    return result;
}
export async function exists(ctx: SpectraContext, id: string): Promise<boolean> {
    const tree = await ctx.bridge.getTree();
    return findNode(tree, id) !== null;
}
export async function isVisible(ctx: SpectraContext, id: string): Promise<boolean> {
    const tree = await ctx.bridge.getTree();
    const node = findNode(tree, id);
    return node?.visible ?? false;
}
export async function getElement(ctx: SpectraContext, id: string): Promise<UITreeNode | null> {
    const tree = await ctx.bridge.getTree();
    return findNode(tree, id);
}
export async function getVisibleElements(ctx: SpectraContext): Promise<UITreeNode[]> {
    const tree = await ctx.bridge.getTree();
    return collectAll(tree).filter((n) => n.visible);
}
export async function currentRoute(ctx: SpectraContext): Promise<string> {
    const route = await ctx.bridge.getRoute();
    return route.pathname;
}
