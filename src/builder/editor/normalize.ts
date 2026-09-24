import type { SerializedNodes } from "@craftjs/core";
import { withDefaults } from "../core/merge.ts";
import { typeOf } from "../core/tree.ts";
import { COMPONENTS } from "../registry.ts";

/**
 * Completa as props salvas com os defaults atuais de cada componente. Assim
 * páginas criadas antes de um campo novo existir abrem com o campo preenchido
 * (e o painel mostra o valor certo em vez de vazio).
 */
export function normalizeNodes(nodes: SerializedNodes): SerializedNodes {
  const out: SerializedNodes = {};
  for (const [id, node] of Object.entries(nodes)) {
    const def = COMPONENTS[typeOf(node)];
    out[id] = def ? { ...node, props: withDefaults(def.defaults, node.props) } : node;
  }
  return out;
}
