/**
 * Estado de visualização só do editor (fora do histórico e do JSON salvo):
 * por exemplo, qual etapa de um formulário está sendo vista no canvas.
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
