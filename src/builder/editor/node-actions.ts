import type { EditorState, Node, NodeTree, SerializedNodes, useEditor } from "@craftjs/core";
import { cloneTree, ROOT_ID } from "../core/tree.ts";

type Editor = ReturnType<typeof useEditor>;
type Query = Editor["query"];
type Actions = Editor["actions"];

/** Converts a serialized subtree into a NodeTree, keeping the ids. */
export function toNodeTree(query: Query, nodes: SerializedNodes, rootNodeId: string): NodeTree {
  const out: Record<string, Node> = {};
  for (const [id, serialized] of Object.entries(nodes)) {
    out[id] = query.parseSerializedNode(serialized).toNode((node) => {
      node.id = id;
    });
  }
  return { rootNodeId, nodes: out };
}

/** Inserts a subtree (section or element) into `parentId` at `index`. */
export function insertTree(
  editor: Editor,
  tree: { rootNodeId: string; nodes: SerializedNodes },
  parentId: string = ROOT_ID,
  index?: number,
  select = true,
) {
  const nodeTree = toNodeTree(editor.query, tree.nodes, tree.rootNodeId);
  editor.actions.addNodeTree(nodeTree, parentId, index);
  if (select) editor.actions.selectNode(tree.rootNodeId);
}

/** Duplicates the node and all children right below it. */
export function duplicateNode(editor: Editor, id: string) {
  const { query } = editor;
  const node = query.node(id).get();
  const parent = node.data.parent;
  if (!parent) return;
  const serialized = query.getSerializedNodes();
  const copy = cloneTree(serialized, id, parent);
  const siblings = query.node(parent).get().data.nodes;
  insertTree(editor, copy, parent, siblings.indexOf(id) + 1);
}

/** Moves a page child up/down, keeping Header at the top and Footer at the end. */
export function moveSection(editor: Editor, id: string, delta: -1 | 1) {
  const { query, actions } = editor;
  const siblings = query.node(ROOT_ID).get().data.nodes;
  const index = siblings.indexOf(id);
  const target = index + delta;
  if (target < 0 || target >= siblings.length) return;
  const targetType = query.node(siblings[target]).get().data.name;
  if (targetType === "Header" || targetType === "Footer") return;
  // Craft counts the index before removing the node from its current position
  actions.move(id, ROOT_ID, delta > 0 ? target + 1 : target);
}

/** Unlinks a global section: becomes a local copy with new ids. */
export function unlinkGlobal(editor: Editor, id: string) {
  const { query, actions } = editor;
  const siblings = query.node(ROOT_ID).get().data.nodes;
  const index = siblings.indexOf(id);
  const copy = cloneTree(query.getSerializedNodes(), id, ROOT_ID);
  actions.delete(id);
  insertTree(editor, copy, ROOT_ID, index);
}

export function isGlobalSection(state: EditorState, id: string) {
  return Boolean(state.nodes[id]?.data.custom?.isGlobal);
}

export type { Actions, Query };
