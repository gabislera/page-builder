import { type Ref, useCallback, useEffect, useRef, useState } from "react";
import { useIsEditor } from "./render-context.tsx";

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
	return (el: T | null) => {
		for (const ref of refs) {
			if (typeof ref === "function") ref(el);
			else if (ref && typeof ref === "object")
				(ref as { current: T | null }).current = el;
		}
	};
}

/** Texto simples com quebras de linha preservadas. */
export function Lines({ text }: { text: string }) {
	const parts = text.split("\n");
	return (
		<>
			{parts.map((line, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: linhas não reordenam
				<span key={i}>
					{line}
					{i < parts.length - 1 ? <br /> : null}
				</span>
			))}
		</>
	);
}

/**
 * Edição inline de texto simples no canvas. Duplo clique entra em edição,
 * Esc ou clique fora confirma. Na página publicada não faz nada.
 */
export function useInlineEdit(
	value: string,
	onCommit: ((value: string) => void) | undefined,
	opts: { multiline?: boolean } = {},
) {
	const isEditor = useIsEditor();
	const [editing, setEditing] = useState(false);
	const elRef = useRef<HTMLElement | null>(null);

	const ref = useCallback((el: HTMLElement | null) => {
		elRef.current = el;
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: entra em edição com o valor do momento
	useEffect(() => {
		const el = elRef.current;
		if (!el || !editing) return;
		el.innerText = value;
		el.setAttribute("draggable", "false");
		el.classList.add("pb-editing");
		el.focus();
		const doc = el.ownerDocument;
		const range = doc.createRange();
		range.selectNodeContents(el);
		const sel = doc.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
		return () => {
			el.setAttribute("draggable", "true");
			el.classList.remove("pb-editing");
		};
	}, [editing]);

	if (!isEditor || !onCommit) {
		return { ref, editing: false, attrs: {} as Record<string, unknown> };
	}

	const finish = () => {
		const el = elRef.current;
		setEditing(false);
		if (!el) return;
		const next = el.innerText.replace(/\n$/, "");
		if (next !== value)
			onCommit(opts.multiline ? next : next.replace(/\n/g, " "));
	};

	return {
		ref,
		editing,
		attrs: editing
			? {
					contentEditable: "plaintext-only",
					suppressContentEditableWarning: true,
					onBlur: finish,
					onKeyDown: (e: React.KeyboardEvent) => {
						e.stopPropagation();
						if (e.key === "Escape" || (!opts.multiline && e.key === "Enter")) {
							e.preventDefault();
							(e.currentTarget as HTMLElement).blur();
						}
					},
				}
			: {
					onDoubleClick: (e: React.MouseEvent) => {
						e.stopPropagation();
						setEditing(true);
					},
				},
	};
}
