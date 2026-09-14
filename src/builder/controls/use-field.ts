import { useNode } from "@craftjs/core";
import { useCallback } from "react";
import { getPath, setPath } from "../core/path.ts";
import {
	assign,
	type Device,
	hasOwn,
	isResponsive,
	resolve,
	unassign,
} from "../core/responsive.ts";
import { useEditorUI } from "../editor/store.ts";

/** Props do nó selecionado + setter por caminho. */
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
	/** O valor salvo é responsivo (varia por dispositivo). */
	responsive: boolean;
	device: Device;
	/** Há valor próprio no dispositivo atual (não herdado). */
	overridden: boolean;
	set: (value: T, opts?: { throttle?: boolean }) => void;
	/** Volta a herdar do dispositivo maior. Só existe fora do desktop. */
	reset?: () => void;
};

/**
 * Liga um controle a uma prop. Se a prop for responsiva, lê e escreve o valor
 * do dispositivo selecionado no editor.
 */
export function useField<T>(path: string): FieldState<T> {
	const device = useEditorUI((s) => s.device);
	const { props, set } = useNodeProps<Record<string, unknown>>();
	const raw = getPath<T>(props, path);
	const responsive = isResponsive(raw);

	const setValue = useCallback(
		(value: T, opts?: { throttle?: boolean }) => {
			const current = getPath<T>(props, path);
			const next = isResponsive<T>(current)
				? assign(current, device, value)
				: value;
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
