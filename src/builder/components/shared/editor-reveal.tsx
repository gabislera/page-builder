/**
 * Só no editor: avisa quando um item de um componente composto (aba, slide,
 * item do acordeão) ou algo dentro dele é selecionado, para o componente
 * mostrar esse item (ativar a aba, rolar até o slide, abrir o painel).
 * Renderizar apenas quando `useIsEditor()` for verdadeiro: usa o Craft.
 */
import { useEditor } from "@craftjs/core";
import { useEffect, useRef } from "react";

export function RevealOnSelect({ id, onReveal }: { id: string; onReveal: (selected: boolean) => void }) {
  const { within } = useEditor((state) => {
    for (const selected of state.events.selected) {
      let current: string | null | undefined = selected;
      while (current) {
        if (current === id) return { within: true };
        current = state.nodes[current]?.data.parent;
      }
    }
    return { within: false };
  });
  const callback = useRef(onReveal);
  callback.current = onReveal;
  useEffect(() => {
    callback.current(within);
  }, [within]);
  return null;
}
