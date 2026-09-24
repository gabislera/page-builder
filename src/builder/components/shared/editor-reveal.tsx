/**
 * Editor only: notifies when an item of a composite component (tab, slide,
 * accordion item) or something inside it is selected, so the component
 * can show that item (activate the tab, scroll to the slide, open the panel).
 * Render only when `useIsEditor()` is true: uses Craft.
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
