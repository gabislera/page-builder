/**
 * Keeps the announcement bar at the top of the page: if it is dropped (or
 * the header is inserted) elsewhere, it moves back to the start.
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
    // "_b" anywhere = bar is not at the top
    if (!order.includes("_b")) return;
    const ids = query.node(ROOT_ID).get().data.nodes;
    const bars = ids.filter((id) => query.node(id).get().data.name === TOP_BAR_TYPE);
    // merge into the same undo step as the action that moved it
    bars.forEach((id, i) => {
      actions.history.merge().move(id, ROOT_ID, i);
    });
  }, [order, actions, query]);
  return null;
}
