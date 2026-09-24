import type { SerializedNodes } from "@craftjs/core";
import { withDefaults } from "../core/merge.ts";
import { typeOf } from "../core/tree.ts";
import { COMPONENTS } from "../registry.ts";

/**
 * Fills saved props with each component's current defaults. Pages created
 * before a field existed open with that field set (and the panel shows the
 * right value instead of empty).
 */
export function normalizeNodes(nodes: SerializedNodes): SerializedNodes {
  const out: SerializedNodes = {};
  for (const [id, node] of Object.entries(nodes)) {
    const def = COMPONENTS[typeOf(node)];
    out[id] = def ? { ...node, props: withDefaults(def.defaults, node.props) } : node;
  }
  return out;
}
