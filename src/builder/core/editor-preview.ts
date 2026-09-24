/**
 * Editor-only preview state (outside history and saved JSON):
 * e.g. which form step is currently shown on the canvas.
 */
import { create } from "zustand";

type PreviewState = {
  formStep: Record<string, number>;
  setFormStep: (nodeId: string, step: number) => void;
};

export const useEditorPreview = create<PreviewState>((set) => ({
  formStep: {},
  setFormStep: (nodeId, step) => set((s) => ({ formStep: { ...s.formStep, [nodeId]: step } })),
}));
