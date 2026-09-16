import { createContext, useContext } from "react";

export type PageSettingsPatch = {
	name?: string;
	slug?: string;
	seo?: import("#/db/schema").PageSeo;
	tracking?: import("#/db/schema").PageTracking;
};

export type PageSummary = { id: string; name: string; slug: string };
export type AssetItem = {
	id: string;
	url: string;
	name: string;
	mimeType: string;
};
export type GlobalSectionItem = {
	id: string;
	name: string;
	kind: import("../core/tree.ts").SectionKind;
	rootNodeId: string;
	nodes: import("@craftjs/core").SerializedNodes;
	usage: number;
};

/**
 * Serviços do servidor usados pelos controles. Injetados pela rota do editor
 * para que os componentes do builder não importem o backend (evita ciclo
 * servidor → renderizador → componentes → servidor).
 */
export type EditorServices = {
	listPages: () => Promise<PageSummary[]>;
	listAssets: () => Promise<AssetItem[]>;
	uploadAsset: (file: File) => Promise<AssetItem>;
	deleteAsset: (assetId: string) => Promise<unknown>;
	listGlobalSections: () => Promise<GlobalSectionItem[]>;
	savePage: (input: {
		version: number;
		root: import("@craftjs/core").SerializedNode;
		sections: import("../core/tree.ts").SectionTree[];
		force?: boolean;
	}) => Promise<{
		version: number;
		updatedAt: string;
		affectedPageIds: string[];
	}>;
	publishPage: (
		republish: string[],
	) => Promise<{ publishedAt: string | null; url: string }>;
	updateSettings: (patch: PageSettingsPatch) => Promise<PageSettingsPatch>;
	updateSiteSettings: (patch: {
		theme?: import("../core/theme.ts").SiteTheme;
		identity?: import("../core/theme.ts").SiteIdentity;
	}) => Promise<import("../core/theme.ts").SiteSettings>;
	republishSite: () => Promise<{ count: number }>;
};

export type EditorContextValue = {
	projectId: string;
	projectSlug: string;
	pageId: string;
	services: EditorServices;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorContextProvider = EditorContext.Provider;

export function useEditorContext() {
	const ctx = useContext(EditorContext);
	if (!ctx) throw new Error("useEditorContext fora do editor");
	return ctx;
}
