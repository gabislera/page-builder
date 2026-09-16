import { create } from "zustand";
import {
	DEFAULT_SITE_SETTINGS,
	type SiteIdentity,
	type SiteSettings,
	type SiteTheme,
} from "../core/theme.ts";
import type { SectionTree } from "../core/tree.ts";

type SiteState = {
	settings: SiteSettings;
	/** Cabeçalho/rodapé do site como estavam ao abrir o editor. */
	siteParts: { header: SectionTree | null; footer: SectionTree | null };
	/** Mudanças de tema/identidade ainda não salvas. */
	dirty: boolean;
	/** Tema ou identidade mudaram desde a última republicação. */
	needsRepublish: boolean;
	init: (settings: SiteSettings, siteParts: SiteState["siteParts"]) => void;
	setTheme: (theme: SiteTheme) => void;
	setIdentity: (identity: SiteIdentity) => void;
	markSaved: (settings: SiteSettings) => void;
	markRepublished: () => void;
};

export const useSiteStore = create<SiteState>((set) => ({
	settings: DEFAULT_SITE_SETTINGS,
	siteParts: { header: null, footer: null },
	dirty: false,
	needsRepublish: false,
	init: (settings, siteParts) =>
		set({ settings, siteParts, dirty: false, needsRepublish: false }),
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
	markSaved: (settings) =>
		set((s) => ({
			// preserva edições feitas enquanto o save estava em andamento
			settings: {
				...settings,
				theme: s.settings.theme,
				identity: s.settings.identity,
			},
			dirty: false,
		})),
	markRepublished: () => set({ needsRepublish: false }),
}));
