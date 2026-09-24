/**
 * Operações sobre a árvore serializada do Craft (SerializedNodes).
 *
 * No banco, a página guarda só o nó ROOT, e cada filho direto do ROOT
 * (Section, Header ou Footer) vira uma linha em `section` com sua subárvore.
 * Isso permite reutilizar a mesma seção (seção global) em várias páginas.
 */

import type { SerializedNode, SerializedNodes } from "@craftjs/core";
import { customAlphabet } from "nanoid";

export const ROOT_ID = "ROOT";

export type SectionKind = "section" | "header" | "footer";

export type SitePart = "header" | "footer";

export type SectionTree = {
  rootNodeId: string;
  kind: SectionKind;
  name: string;
  isGlobal: boolean;
  /**
   * Cabeçalho/rodapé do site: vem das configurações do projeto e aparece em
   * todas as páginas que usam o padrão. Não entra na lista de seções da página.
   */
  sitePart?: SitePart;
  nodes: SerializedNodes;
};

const KIND_BY_TYPE: Record<string, SectionKind> = {
  Section: "section",
  Header: "header",
  Footer: "footer",
};

export const newNodeId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

export const typeOf = (node: SerializedNode) => (typeof node.type === "string" ? node.type : node.type.resolvedName);

/** A seção é uma barra de aviso (vai antes do cabeçalho). */
export const isTopBar = (s: Pick<SectionTree, "rootNodeId" | "nodes">) => {
  const node = s.nodes[s.rootNodeId];
  return Boolean(node) && typeOf(node) === "AnnouncementBar";
};

/** Todos os ids da subárvore de `id`, incluindo ele mesmo. */
export function descendants(nodes: SerializedNodes, id: string): string[] {
  const out: string[] = [];
  const walk = (nodeId: string) => {
    const node = nodes[nodeId];
    if (!node) return;
    out.push(nodeId);
    for (const child of node.nodes ?? []) walk(child);
    for (const linked of Object.values(node.linkedNodes ?? {})) walk(linked);
  };
  walk(id);
  return out;
}

export function subtree(nodes: SerializedNodes, id: string): SerializedNodes {
  const out: SerializedNodes = {};
  for (const nodeId of descendants(nodes, id)) out[nodeId] = nodes[nodeId];
  return out;
}

/** Divide a árvore completa da página em ROOT + seções, na ordem. */
export function splitPage(nodes: SerializedNodes): {
  root: SerializedNode;
  sections: SectionTree[];
} {
  const root = nodes[ROOT_ID];
  if (!root) throw new Error("Árvore sem nó ROOT");
  const sections = (root.nodes ?? []).map((childId) => {
    const child = nodes[childId];
    const kind = KIND_BY_TYPE[typeOf(child)] ?? "section";
    return {
      rootNodeId: childId,
      kind,
      name: (child.custom?.displayName as string) || child.displayName,
      isGlobal: Boolean(child.custom?.isGlobal || child.custom?.sitePart),
      sitePart: (child.custom?.sitePart as SitePart | undefined) ?? undefined,
      nodes: subtree(nodes, childId),
    };
  });
  return { root: { ...root, nodes: [] }, sections };
}

/** Remonta a árvore completa a partir do ROOT salvo e das seções ordenadas. */
export function mergePage(
  root: SerializedNode,
  sections: Pick<SectionTree, "rootNodeId" | "nodes" | "isGlobal" | "sitePart">[],
): SerializedNodes {
  const out: SerializedNodes = {};
  const rootNodes: string[] = [];
  for (const s of sections) {
    for (const [id, node] of Object.entries(s.nodes)) out[id] = node;
    const sectionRoot = out[s.rootNodeId];
    if (!sectionRoot) continue;
    out[s.rootNodeId] = {
      ...sectionRoot,
      parent: ROOT_ID,
      custom: {
        ...sectionRoot.custom,
        isGlobal: s.sitePart ? false : s.isGlobal,
        sitePart: s.sitePart,
      },
    };
    rootNodes.push(s.rootNodeId);
  }
  out[ROOT_ID] = {
    ...root,
    parent: null as unknown as string,
    nodes: rootNodes,
  };
  return out;
}

/**
 * Copia uma subárvore com ids novos. Usado para inserir modelos de seção,
 * duplicar e desvincular seções globais.
 */
export function cloneTree(
  nodes: SerializedNodes,
  rootNodeId: string,
  parentId: string | null = null,
): { rootNodeId: string; nodes: SerializedNodes } {
  const ids = new Map<string, string>();
  for (const id of descendants(nodes, rootNodeId)) ids.set(id, newNodeId());
  const map = (id: string) => ids.get(id) ?? id;

  const out: SerializedNodes = {};
  for (const [oldId, newId] of ids) {
    const node = structuredClone(nodes[oldId]);
    node.nodes = (node.nodes ?? []).map(map);
    node.linkedNodes = Object.fromEntries(Object.entries(node.linkedNodes ?? {}).map(([k, v]) => [k, map(v)]));
    node.parent = (oldId === rootNodeId ? parentId : node.parent ? map(node.parent) : null) as string;
    if (oldId === rootNodeId && node.custom) {
      node.custom = { ...node.custom, isGlobal: false, sitePart: undefined };
    }
    out[newId] = node;
  }
  return { rootNodeId: map(rootNodeId), nodes: out };
}
