import { createContext, useContext } from "react";
import { DEFAULT_IDENTITY, type SiteIdentity } from "./theme.ts";

export type RenderMode = "editor" | "publish";

export type RenderContextValue = {
	mode: RenderMode;
	/** ID da página sendo renderizada (formulários, analytics). */
	pageId: string;
	/** URL pública de outra página do projeto, para ações do tipo "page". */
	pageUrl: (pageId: string) => string;
	/** Identidade do site (nome e logo), usada pelo elemento Logo. */
	site: SiteIdentity;
	/** URL da página inicial do site (link padrão do logo). */
	homeUrl: string;
};

const RenderContext = createContext<RenderContextValue>({
	mode: "editor",
	pageId: "",
	pageUrl: () => "#",
	site: DEFAULT_IDENTITY,
	homeUrl: "#",
});

export const RenderProvider = RenderContext.Provider;

export const useRender = () => useContext(RenderContext);
export const useIsEditor = () => useContext(RenderContext).mode === "editor";
