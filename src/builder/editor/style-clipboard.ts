/**
 * Estilo copiado (fica no navegador: dá para colar em outra página).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CopiedStyle } from "../core/style-copy.ts";

export const useStyleClipboard = create<{
	style: CopiedStyle | null;
	/** Nome do elemento de origem, para as mensagens ("estilo do Botão"). */
	from: string;
	copy: (style: CopiedStyle, from: string) => void;
}>()(
	persist(
		(set) => ({
			style: null,
			from: "",
			copy: (style, from) => set({ style, from }),
		}),
		{ name: "pb-style-clipboard" },
	),
);
