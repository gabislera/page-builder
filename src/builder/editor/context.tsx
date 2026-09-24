import type { SerializedNodes } from "@craftjs/core";
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
 * Server services used by controls. Injected by the editor route so builder
 * components do not import the backend (avoids a server → renderer →
 * components → server cycle).
 */
/** User-saved section template. */
export type SavedSection = {
  id: string;
  name: string;
  kind: "section" | "header" | "footer";
  rootNodeId: string;
  nodes: SerializedNodes;
  createdAt: string;
};

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
  publishPage: (republish: string[]) => Promise<{ publishedAt: string | null; url: string }>;
  unpublishPage: () => Promise<{ ok: boolean }>;
  listSavedSections: () => Promise<SavedSection[]>;
  saveSectionAsTemplate: (input: {
    name: string;
    kind: "section" | "header" | "footer";
    rootNodeId: string;
    nodes: SerializedNodes;
  }) => Promise<{ id: string }>;
  deleteSavedSection: (id: string) => Promise<{ ok: boolean }>;
  updateSettings: (patch: PageSettingsPatch) => Promise<PageSettingsPatch>;
  updateSiteSettings: (patch: {
    theme?: import("../core/theme.ts").SiteTheme;
    identity?: import("../core/theme.ts").SiteIdentity;
    cookieBanner?: import("../core/theme.ts").CookieBanner;
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
