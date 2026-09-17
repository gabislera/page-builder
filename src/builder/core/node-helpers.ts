import { nodeClass } from "./style-engine.ts";
import type { Box } from "./style-types.ts";

/** Classes do elemento raiz de um nó: base + id + animação + classe custom. */
export function nodeClassName(id: string, base: string, box?: Partial<Box>) {
	return [
		base,
		nodeClass(id),
		box?.animation && box.animation !== "none"
			? `pb-anim-${box.animation}`
			: null,
		box?.scrollEffect?.type === "parallax" ? "pb-parallax" : null,
		box?.cssClass || null,
	]
		.filter(Boolean)
		.join(" ");
}

/** Tipos que só podem ser filhos diretos da página. */
export const TOP_LEVEL_TYPES = new Set(["Section", "Header", "Footer"]);
