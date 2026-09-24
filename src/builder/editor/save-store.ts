import { create } from "zustand";

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

type SaveState = {
  status: SaveStatus;
  version: number;
  lastSavedAt: string | null;
  publishedAt: string | null;
  /** Outras páginas publicadas afetadas por seções globais editadas. */
  affectedPageIds: string[];
  error: string | null;
  /** Pedido de salvar imediatamente (Ctrl+S, publicar). */
  flushRequest: number;
  /** Incrementa a cada mudança nos nós (onNodesChange do Craft). */
  changeTick: number;
  set: (patch: Partial<Omit<SaveState, "set" | "requestFlush" | "markChanged">>) => void;
  markChanged: () => void;
  requestFlush: () => void;
};

export const useSaveState = create<SaveState>((set) => ({
  status: "saved",
  version: 1,
  lastSavedAt: null,
  publishedAt: null,
  affectedPageIds: [],
  error: null,
  flushRequest: 0,
  changeTick: 0,
  set: (patch) => set(patch),
  requestFlush: () => set((s) => ({ flushRequest: s.flushRequest + 1 })),
  markChanged: () => set((s) => ({ changeTick: s.changeTick + 1 })),
}));
