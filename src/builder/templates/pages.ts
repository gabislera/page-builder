import { buildRoot, buildTree } from "../core/build.ts";
import { ROOT_ID, type SectionTree } from "../core/tree.ts";
import { SECTION_TEMPLATES } from "./sections.ts";

/** Página nova: raiz + um hero centralizado. */
export function blankPage(): {
	root: ReturnType<typeof buildRoot>;
	sections: SectionTree[];
} {
	const hero = SECTION_TEMPLATES.find((t) => t.id === "hero-centered");
	if (!hero) throw new Error("Modelo hero-centered ausente");
	const tree = buildTree(hero.build(), ROOT_ID);
	return {
		root: buildRoot(),
		sections: [
			{
				rootNodeId: tree.rootNodeId,
				kind: "section",
				name: "Hero",
				isGlobal: false,
				nodes: tree.nodes,
			},
		],
	};
}
