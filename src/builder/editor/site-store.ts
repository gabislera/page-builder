import { create } from "zustand";
import {
  type CookieBanner,
  DEFAULT_SITE_SETTINGS,
  type SiteIdentity,
  type SiteSettings,
  type SiteTheme,
} from "../core/theme.ts";
import type { SectionTree } from "../core/tree.ts";

type SiteState = {
  settings: SiteSettings;
  /** Site header/footer as they were when the editor opened. */
  siteParts: { header: SectionTree | null; footer: SectionTree | null };
  /** Unsaved theme/identity changes. */
  dirty: boolean;
  /** Theme or identity changed since the last republish. */
  needsRepublish: boolean;
  init: (settings: SiteSettings, siteParts: SiteState["siteParts"]) => void;
  setTheme: (theme: SiteTheme) => void;
  setIdentity: (identity: SiteIdentity) => void;
  setCookieBanner: (cookieBanner: CookieBanner) => void;
  markSaved: (settings: SiteSettings) => void;
  markRepublished: () => void;
};

export const useSiteStore = create<SiteState>((set) => ({
  settings: DEFAULT_SITE_SETTINGS,
  siteParts: { header: null, footer: null },
  dirty: false,
  needsRepublish: false,
  init: (settings, siteParts) => set({ settings, siteParts, dirty: false, needsRepublish: false }),
  setTheme: (theme) =>
    set((s) => ({
      settings: { ...s.settings, theme },
      dirty: true,
      needsRepublish: true,
    })),
  setIdentity: (identity) =>
    set((s) => ({
      settings: { ...s.settings, identity },
      dirty: true,
      needsRepublish: true,
    })),
  setCookieBanner: (cookieBanner) =>
    set((s) => ({
      settings: { ...s.settings, cookieBanner },
      dirty: true,
      needsRepublish: true,
    })),
  markSaved: (settings) =>
    set((s) => ({
      // keep edits made while the save was in flight
      settings: {
        ...settings,
        theme: s.settings.theme,
        identity: s.settings.identity,
        cookieBanner: s.settings.cookieBanner,
      },
      dirty: false,
    })),
  markRepublished: () => set({ needsRepublish: false }),
}));
