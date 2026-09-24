import { useNode } from "@craftjs/core";
import { useCallback } from "react";
import { setPath } from "./path.ts";
import { EDITOR_HIDDEN_STYLE, HIDDEN_DISPLAY } from "./style-engine.ts";
import type { AnyComponentDefinition } from "./types.ts";

/**
 * Transforma uma definição de componente num componente do Craft: conecta o
 * elemento raiz à seleção/drag e injeta o CSS do nó no canvas.
 */
export function craftify(def: AnyComponentDefinition) {
  function CraftComponent(allProps: Record<string, unknown>) {
    const { children, ...props } = allProps;
    const {
      id,
      connectors: { connect, drag },
      actions: { setProp },
    } = useNode();
    const onPropChange = useCallback(
      (path: string, value: unknown) => setProp((draft: Record<string, unknown>) => setPath(draft, path, value)),
      [setProp],
    );
    // no editor, elementos ocultos num dispositivo ficam translúcidos em vez de sumir
    const css = def.css(id, props).replaceAll(`display:${HIDDEN_DISPLAY}`, EDITOR_HIDDEN_STYLE);
    const rootRef = useCallback(
      (el: HTMLElement | null) => {
        if (el) connect(drag(el));
      },
      [connect, drag],
    );
    return (
      <>
        {css ? <style data-node={id}>{css}</style> : null}
        <def.View id={id} props={props} rootRef={rootRef} onPropChange={onPropChange}>
          {children as React.ReactNode}
        </def.View>
      </>
    );
  }

  CraftComponent.displayName = def.type;
  CraftComponent.craft = {
    displayName: def.displayName,
    props: def.defaults,
    isCanvas: def.isCanvas ?? false,
    rules: def.rules,
    related: { settings: def.Settings },
    custom: {
      notDuplicable: def.notDuplicable ?? false,
      notDeletable: def.notDeletable ?? false,
    },
  };
  return CraftComponent;
}
