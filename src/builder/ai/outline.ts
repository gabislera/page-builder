import type { SerializedNodes } from "@craftjs/core";
import { descendants, ROOT_ID, typeOf } from "../core/tree.ts";

const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * One line per page section ("Hero: Do zero ao primeiro emprego"), so
 * the model writes copy consistent with what is already on the page.
 */
export function pageOutline(nodes: SerializedNodes): string[] {
  return (nodes[ROOT_ID]?.nodes ?? []).map((id) => {
    const node = nodes[id];
    const name = (node.custom?.displayName as string) || node.displayName;
    const heading = descendants(nodes, id)
      .map((n) => nodes[n])
      .find((n) => typeOf(n) === "Heading" && String(n.props.tag ?? "").startsWith("h"));
    const text = heading ? plain(String(heading.props.text ?? "")) : "";
    return (text ? `${name}: ${text}` : name).slice(0, 200);
  });
}
