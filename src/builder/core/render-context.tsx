import { createContext, useContext } from "react";
import { DEFAULT_IDENTITY, type SiteIdentity } from "./theme.ts";

export type RenderMode = "editor" | "publish";

export type RenderContextValue = {
  mode: RenderMode;
  /** ID of the page being rendered (forms, analytics). */
  pageId: string;
  /** Public URL of another project page, for "page" actions. */
  pageUrl: (pageId: string) => string;
  /** Site identity (name and logo), used by the Logo element. */
  site: SiteIdentity;
  /** URL of the site home page (default logo link). */
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
