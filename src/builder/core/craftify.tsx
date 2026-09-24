import { useNode } from "@craftjs/core";
import { useCallback } from "react";
import { setPath } from "./path.ts";
import { EDITOR_HIDDEN_STYLE, HIDDEN_DISPLAY } from "./style-engine.ts";
import type { AnyComponentDefinition } from "./types.ts";

/**
 * Turns a component definition into a Craft component: connects the
 * root element to selection/drag and injects the node's CSS into the canvas.
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
    // in the editor, elements hidden on a device stay translucent instead of disappearing
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
