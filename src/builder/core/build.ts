/**
 * Construtor de árvores serializadas, usado pelos modelos de página e de
 * seção. Mescla as props informadas sobre os defaults do componente.
 */
import type { SerializedNode, SerializedNodes } from "@craftjs/core";
import { COMPONENTS } from "../registry.ts";
import { deepMerge } from "./merge.ts";
import { newNodeId, ROOT_ID } from "./tree.ts";

export { deepMerge };

export type NodeSpec = {
  type: string;
  props?: Record<string, unknown>;
  name?: string;
  children?: NodeSpec[];
};

/** Atalho: h("Heading", { text: "..." }, [...filhos]) */
export const h = (
  type: string,
  props: Record<string, unknown> = {},
  children: NodeSpec[] = [],
  name?: string,
): NodeSpec => ({ type, props, children, name });

export function buildTree(
  spec: NodeSpec,
  parent: string | null,
  id: string = newNodeId(),
): { rootNodeId: string; nodes: SerializedNodes } {
  const def = COMPONENTS[spec.type];
  if (!def) throw new Error(`Componente desconhecido: ${spec.type}`);
  const nodes: SerializedNodes = {};
  const childIds: string[] = [];
  for (const child of spec.children ?? []) {
    const built = buildTree(child, id);
    childIds.push(built.rootNodeId);
    Object.assign(nodes, built.nodes);
  }
  const node: SerializedNode = {
    type: { resolvedName: spec.type },
    isCanvas: Boolean(def.isCanvas),
    props: deepMerge(structuredClone(def.defaults), spec.props ?? {}) as Record<string, unknown>,
    displayName: def.displayName,
    custom: spec.name ? { displayName: spec.name } : {},
    hidden: false,
    nodes: childIds,
    linkedNodes: {},
    parent: parent as string,
  };
  nodes[id] = node;
  return { rootNodeId: id, nodes };
}

/** Nó ROOT (Page) sem filhos. */
export function buildRoot(props: Record<string, unknown> = {}): SerializedNode {
  return buildTree({ type: "Page", props }, null, ROOT_ID).nodes[ROOT_ID];
}
