import { create } from "zustand";

/** Controls the section library dialog and where the section will be inserted. */
export const useSectionPicker = create<{
  isOpen: boolean;
  /** Index among page children. `undefined` = end (before the footer). */
  index: number | undefined;
  /** Category opened with the dialog (e.g. "Cabeçalho"). */
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
