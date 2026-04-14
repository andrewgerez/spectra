import { activeElement, ElementNode } from "@lightningtv/solid";
import { createEffect, on } from "solid-js";
import type { FocusedElement } from "./types";
function resolveNodeId(node: ElementNode | undefined): string | undefined {
    let current = node;
    while (current) {
        const candidate = current.id ?? current._id;
        if (typeof candidate === "string" &&
            candidate !== "" &&
            candidate !== "0") {
            return candidate;
        }
        current = current.parent;
    }
    return undefined;
}
function buildFocusedElement(node: ElementNode | undefined): FocusedElement {
    const id = resolveNodeId(node) ?? node?.name ?? `node__${node?.lng?.id ?? "unknown"}`;
    return {
        id: id ?? "",
        path: id ?? "",
        text: node?.text ?? node?._text ?? "",
        meta: node?._testMeta ?? {},
    } as FocusedElement;
}
export function createSpectraFocusTracking(): void {
    const api = window.__TEST_API__;
    if (typeof window === "undefined" || !api)
        return;
    createEffect(on(activeElement, (element) => {
        if (!element) {
            api._notifyFocusChange(null);
            return;
        }
        const focused = buildFocusedElement(element);
        api._notifyFocusChange(focused);
    }));
}
