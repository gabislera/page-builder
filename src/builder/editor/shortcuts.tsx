import type { SerializedNodes } from "@craftjs/core";
import { useEditor } from "@craftjs/core";
import { useEffect } from "react";
import { TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { cloneTree, ROOT_ID } from "../core/tree.ts";
import { duplicateNode, insertTree } from "./node-actions.ts";
import { useSaveState } from "./save-store.ts";

let clipboard: {
  rootNodeId: string;
  nodes: SerializedNodes;
  type: string;
} | null = null;

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
};

/** Atalhos do editor. Escuta no documento principal e no do canvas. */
export function KeyboardShortcuts({ canvasDoc }: { canvasDoc: Document | null }) {
  const editor = useEditor();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const [selected] = editor.query.getEvent("selected").all();
      const key = e.key.toLowerCase();

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) editor.actions.history.redo();
        else editor.actions.history.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        editor.actions.history.redo();
        return;
      }
      if (mod && key === "s") {
        e.preventDefault();
        useSaveState.getState().requestFlush();
        return;
      }
      if (key === "escape") {
        editor.actions.selectNode();
        return;
      }
      if (!selected || selected === ROOT_ID) return;
      const node = editor.query.node(selected);

      if ((key === "delete" || key === "backspace") && node.isDeletable()) {
        e.preventDefault();
        editor.actions.delete(selected);
      } else if (mod && key === "d" && !node.get().data.custom?.notDuplicable) {
        e.preventDefault();
        duplicateNode(editor, selected);
      } else if (mod && key === "c" && !node.get().data.custom?.notDuplicable) {
        const all = editor.query.getSerializedNodes();
        clipboard = {
          ...cloneTree(all, selected, null),
          type: node.get().data.name,
        };
      } else if (mod && key === "v" && clipboard) {
        e.preventDefault();
        pasteAfter(selected);
      }
    };

    const pasteAfter = (selected: string) => {
      if (!clipboard) return;
      const { query } = editor;
      const target = query.node(selected).get();
      const fresh = cloneTree(clipboard.nodes, clipboard.rootNodeId, null);
      let parent: string | null;
      let index: number;
      if (TOP_LEVEL_TYPES.has(clipboard.type)) {
        // seção: cola na página, logo depois da seção que contém a seleção
        if (clipboard.type !== "Section") return;
        let ancestor = selected;
        while (query.node(ancestor).get().data.parent !== ROOT_ID) {
          const up = query.node(ancestor).get().data.parent;
          if (!up) return;
          ancestor = up;
        }
        parent = ROOT_ID;
        index = query.node(ROOT_ID).get().data.nodes.indexOf(ancestor) + 1;
      } else if (target.data.isCanvas) {
        parent = selected;
        index = target.data.nodes.length;
      } else {
        parent = target.data.parent;
        if (!parent || parent === ROOT_ID) return;
        index = query.node(parent).get().data.nodes.indexOf(selected) + 1;
      }
      fresh.nodes[fresh.rootNodeId].parent = parent;
      insertTree(editor, fresh, parent, index);
    };

    const docs = [document, canvasDoc].filter(Boolean) as Document[];
    for (const d of docs) d.addEventListener("keydown", onKey);
    return () => {
      for (const d of docs) d.removeEventListener("keydown", onKey);
    };
  }, [editor, canvasDoc]);

  return null;
}
