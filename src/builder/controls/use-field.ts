import { useNode } from "@craftjs/core";
import { useCallback } from "react";
import { getPath, setPath } from "../core/path.ts";
import { assign, type Device, hasOwn, isResponsive, resolve, unassign } from "../core/responsive.ts";
import { useEditorUI } from "../editor/store.ts";

/** Selected node props + setter by path. */
export function useNodeProps<P extends object>() {
  const {
    id,
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props as P }));

  const set = useCallback(
    (path: string, value: unknown, throttleMs?: number) => {
      setProp((draft: Record<string, unknown>) => {
        setPath(draft, path, value);
      }, throttleMs);
    },
    [setProp],
  );

  const update = useCallback(
    (mutate: (draft: P) => void, throttleMs?: number) => {
      setProp((draft: P) => mutate(draft), throttleMs);
    },
    [setProp],
  );

  return { id, props, set, update };
}

export type FieldState<T> = {
  value: T;
  /** The saved value is responsive (varies by device). */
  responsive: boolean;
  device: Device;
  /** There is an own value on the current device (not inherited). */
  overridden: boolean;
  set: (value: T, opts?: { throttle?: boolean }) => void;
  /** Falls back to the larger device. Only exists off desktop. */
  reset?: () => void;
};

/**
 * Binds a control to a prop. If the prop is responsive, reads and writes
 * the value of the device selected in the editor.
 */
export function useField<T>(path: string): FieldState<T> {
  const device = useEditorUI((s) => s.device);
  const { props, set } = useNodeProps<Record<string, unknown>>();
  const raw = getPath<T>(props, path);
  const responsive = isResponsive(raw);

  const setValue = useCallback(
    (value: T, opts?: { throttle?: boolean }) => {
      const current = getPath<T>(props, path);
      const next = isResponsive<T>(current) ? assign(current, device, value) : value;
      set(path, next, opts?.throttle ? 400 : undefined);
    },
    [props, path, device, set],
  );

  const reset =
    responsive && device !== "desktop" && hasOwn(raw, device)
      ? () => {
          if (isResponsive<T>(raw)) set(path, unassign(raw, device));
        }
      : undefined;

  return {
    value: resolve(raw, device),
    responsive,
    device,
    overridden: responsive && hasOwn(raw, device),
    set: setValue,
    reset,
  };
}
