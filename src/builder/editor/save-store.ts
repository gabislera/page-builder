import { create } from "zustand";

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

type SaveState = {
  status: SaveStatus;
  version: number;
  lastSavedAt: string | null;
  publishedAt: string | null;
  /** Other published pages affected by edited global sections. */
  affectedPageIds: string[];
  error: string | null;
  /** Immediate save request (Ctrl+S, publish). */
  flushRequest: number;
  /** Increments on every node change (Craft `onNodesChange`). */
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
