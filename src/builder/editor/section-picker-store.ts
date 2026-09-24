import { create } from "zustand";

/** Controla o diálogo da biblioteca de seções e onde a seção será inserida. */
export const useSectionPicker = create<{
  isOpen: boolean;
  /** Posição entre os filhos da página. `undefined` = no fim (antes do rodapé). */
  index: number | undefined;
  /** Categoria aberta ao exibir o diálogo (ex.: "Cabeçalho"). */
  category: string | undefined;
  open: (index?: number, category?: string) => void;
  close: () => void;
}>((set) => ({
  isOpen: false,
  index: undefined,
  category: undefined,
  open: (index, category) => set({ isOpen: true, index, category }),
  close: () => set({ isOpen: false }),
}));
