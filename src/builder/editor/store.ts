import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Device } from "../core/responsive.ts";

export type LeftPanel = "add" | "layers" | "page" | "theme";

type EditorUIState = {
  device: Device;
  /** "fit" ajusta o canvas à largura disponível. */
  zoom: "fit" | number;
  leftPanel: LeftPanel;
  favoriteColors: string[];
  /** Otimiza imagens antes de enviar (WebP, tamanho máximo). */
  optimizeImages: boolean;
  setOptimizeImages: (v: boolean) => void;
  setDevice: (device: Device) => void;
  setZoom: (zoom: "fit" | number) => void;
  setLeftPanel: (panel: LeftPanel) => void;
  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;
};

export const useEditorUI = create<EditorUIState>()(
  persist(
    (set) => ({
      device: "desktop",
      zoom: "fit",
      leftPanel: "add",
      favoriteColors: ["#2563eb", "#18181b", "#ffffff", "#f4f4f5", "#22c55e", "#ef4444"],
      optimizeImages: true,
      setOptimizeImages: (optimizeImages) => set({ optimizeImages }),
      setDevice: (device) => set({ device }),
      setZoom: (zoom) => set({ zoom }),
      setLeftPanel: (leftPanel) => set({ leftPanel }),
      addFavoriteColor: (color) =>
        set((s) => ({
          favoriteColors: s.favoriteColors.includes(color) ? s.favoriteColors : [...s.favoriteColors, color].slice(-16),
        })),
      removeFavoriteColor: (color) =>
        set((s) => ({
          favoriteColors: s.favoriteColors.filter((c) => c !== color),
        })),
    }),
    {
      name: "pb-editor-ui",
      partialize: (s) => ({
        zoom: s.zoom,
        favoriteColors: s.favoriteColors,
        optimizeImages: s.optimizeImages,
      }),
    },
  ),
);
