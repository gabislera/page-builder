/**
 * Mantém a barra de aviso no topo da página: se ela for solta (ou o
 * cabeçalho inserido) em outro lugar, volta para o início, antes de tudo.
 */
import { useEditor } from "@craftjs/core";
import { useEffect } from "react";
import { TOP_BAR_TYPE } from "../core/node-helpers.ts";
import { ROOT_ID } from "../core/tree.ts";

export function TopBarOrder() {
  const { actions, query, order } = useEditor((state) => ({
    order: (state.nodes[ROOT_ID]?.data.nodes ?? [])
      .map((id) => (state.nodes[id]?.data.name === TOP_BAR_TYPE ? "b" : "_"))
      .join(""),
  }));
  useEffect(() => {
    // "_b" em qualquer ponto = barra fora do topo
    if (!order.includes("_b")) return;
    const ids = query.node(ROOT_ID).get().data.nodes;
    const bars = ids.filter((id) => query.node(id).get().data.name === TOP_BAR_TYPE);
    // junta no mesmo passo de desfazer da ação que a tirou do lugar
    bars.forEach((id, i) => {
      actions.history.merge().move(id, ROOT_ID, i);
    });
  }, [order, actions, query]);
  return null;
}
