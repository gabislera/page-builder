import { createContext, useContext } from "react";

export type RenderMode = "editor" | "publish";

export type RenderContextValue = {
	mode: RenderMode;
	/** ID da página sendo renderizada (formulários, analytics). */
	pageId: string;
	/** URL pública de outra página do projeto, para ações do tipo "page". */
	pageUrl: (pageId: string) => string;
};

const RenderContext = createContext<RenderContextValue>({
	mode: "editor",
	pageId: "",
	pageUrl: () => "#",
});

export const RenderProvider = RenderContext.Provider;

export const useRender = () => useContext(RenderContext);
export const useIsEditor = () => useContext(RenderContext).mode === "editor";
