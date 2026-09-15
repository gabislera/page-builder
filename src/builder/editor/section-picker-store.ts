import { create } from "zustand";

/** Controla o diálogo da biblioteca de seções e onde a seção será inserida. */
export const useSectionPicker = create<{
	isOpen: boolean;
	/** Posição entre os filhos da página. `undefined` = no fim (antes do rodapé). */
	index: number | undefined;
	open: (index?: number) => void;
	close: () => void;
}>((set) => ({
	isOpen: false,
	index: undefined,
	open: (index) => set({ isOpen: true, index }),
	close: () => set({ isOpen: false }),
}));
