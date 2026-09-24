import { useEditor } from "@craftjs/core";
import { toast } from "sonner";
import { applyStyle, extractStyle, pastableKeys } from "../core/style-copy.ts";
import { ROOT_ID } from "../core/tree.ts";
import { useStyleClipboard } from "./style-clipboard.ts";

/** Copiar/colar estilo do elemento selecionado (painel e atalhos). */
export function useStyleActions() {
	const { actions, query } = useEditor();

	const info = (id: string) => {
		const node = query.node(id).get();
		return {
			type: node.data.name,
			label: (node.data.custom?.displayName as string) || node.data.displayName,
			props: node.data.props as Record<string, unknown>,
		};
	};

	const copyStyle = (id: string) => {
		if (!id || id === ROOT_ID) return;
		const n = info(id);
		useStyleClipboard.getState().copy(extractStyle(n.type, n.props), n.label);
		toast.success("Estilo copiado", {
			description: `Selecione outro elemento e use "Colar estilo" (Ctrl+Alt+V).`,
		});
	};

	/** Quantas propriedades o estilo copiado mudaria neste elemento. */
	const canPaste = (id: string) => {
		const { style } = useStyleClipboard.getState();
		if (!style || !id || id === ROOT_ID) return false;
		const n = info(id);
		return pastableKeys(style, n.type, n.props).length > 0;
	};

	const pasteStyle = (id: string) => {
		const { style, from } = useStyleClipboard.getState();
		if (!style || !id || id === ROOT_ID) return;
		const n = info(id);
		if (!pastableKeys(style, n.type, n.props).length) {
			toast.error("Esse estilo não combina com este elemento", {
				description: `O estilo copiado de "${from}" não tem nada em comum com ${n.label}.`,
			});
			return;
		}
		actions.setProp(id, (draft: Record<string, unknown>) =>
			applyStyle(style, n.type, draft),
		);
		toast.success("Estilo colado", {
			description:
				style.type === n.type
					? `Estilo de "${from}" aplicado. Ctrl+Z desfaz.`
					: `Tipografia, fundo, borda e sombra de "${from}" aplicados. Ctrl+Z desfaz.`,
		});
	};

	return { copyStyle, pasteStyle, canPaste };
}
