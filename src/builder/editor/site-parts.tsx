/**
 * Cabeçalho e rodapé: ações e UI para decidir se a página usa o do site
 * (igual em todas as páginas), um próprio, ou nenhum.
 */

import type { SerializedNodes } from "@craftjs/core";
import { useEditor } from "@craftjs/core";
import { Files, FileText, LayoutTemplate, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "#/lib/utils";
import { TOP_BAR_TYPE } from "../core/node-helpers.ts";
import {
	ROOT_ID,
	type SectionTree,
	type SitePart,
	subtree,
} from "../core/tree.ts";
import { insertTree, unlinkGlobal } from "./node-actions.ts";
import { useSectionPicker } from "./section-picker-store.ts";
import { useSiteStore } from "./site-store.ts";

export const PART_TYPE: Record<SitePart, string> = {
	header: "Header",
	footer: "Footer",
};

export const PART_LABEL: Record<SitePart, string> = {
	header: "Cabeçalho",
	footer: "Rodapé",
};

/** Categoria da biblioteca de seções para cada parte. */
export const PART_CATEGORY = PART_LABEL;

export type PartScope = "site" | "page";

/** Estado e ações do cabeçalho ou rodapé da página aberta. */
export function useSitePart(part: SitePart) {
	const editor = useEditor();
	const stored = useSiteStore((s) => s.siteParts[part]);
	const { current } = useEditor((state) => {
		const id = (state.nodes[ROOT_ID]?.data.nodes ?? []).find(
			(n) => state.nodes[n]?.data.name === PART_TYPE[part],
		);
		const node = id ? state.nodes[id] : null;
		return {
			current: node
				? { id: node.id, isSite: Boolean(node.data.custom?.sitePart) }
				: null,
		};
	});
	const label = PART_LABEL[part];

	/** Cabeçalho logo depois das barras de aviso; rodapé no fim. */
	const indexFor = () => {
		const ids = editor.query.node(ROOT_ID).get().data.nodes;
		if (part === "footer") return ids.length;
		return ids.filter(
			(id) => editor.query.node(id).get().data.name === TOP_BAR_TYPE,
		).length;
	};

	/** Guarda a versão do site antes de tirá-la da página, para poder voltar. */
	const stash = (id: string) => {
		const tree: SectionTree = {
			rootNodeId: id,
			kind: part,
			name: label,
			isGlobal: true,
			sitePart: part,
			nodes: subtree(editor.query.getSerializedNodes(), id),
		};
		useSiteStore.setState((s) => ({
			siteParts: { ...s.siteParts, [part]: tree },
		}));
	};

	const removeCurrent = () => {
		if (!current) return;
		if (current.isSite) stash(current.id);
		editor.actions.delete(current.id);
	};

	/** Coloca na página o cabeçalho/rodapé do site. */
	const applySiteVersion = () => {
		if (!stored) return;
		removeCurrent();
		const nodes = structuredClone(stored.nodes);
		nodes[stored.rootNodeId] = {
			...nodes[stored.rootNodeId],
			parent: ROOT_ID,
			custom: {
				...nodes[stored.rootNodeId].custom,
				sitePart: part,
				isGlobal: false,
			},
		};
		insertTree(
			editor,
			{ rootNodeId: stored.rootNodeId, nodes },
			ROOT_ID,
			indexFor(),
		);
	};

	/** Muda onde o cabeçalho/rodapé atual aparece. */
	const setScope = (scope: PartScope) => {
		if (!current) return;
		if (scope === "page" && current.isSite) {
			// vira uma cópia só desta página; o do site continua igual nas outras
			stash(current.id);
			unlinkGlobal(editor, current.id);
			toast.success(`${label} agora é só desta página`, {
				description: "As outras páginas continuam com o do site.",
			});
		}
		if (scope === "site" && !current.isSite) {
			editor.actions.setCustom(
				current.id,
				(custom: Record<string, unknown>) => {
					custom.sitePart = part;
					custom.isGlobal = false;
				},
			);
			toast.success(`${label} aplicado em todas as páginas`, {
				description: "Ele substitui o que o site usava antes.",
			});
		}
	};

	/** Insere um modelo novo, no lugar do atual. */
	const insertTemplate = (
		tree: { rootNodeId: string; nodes: SerializedNodes },
		scope: PartScope,
	) => {
		removeCurrent();
		if (scope === "site") {
			const root = tree.nodes[tree.rootNodeId];
			root.custom = { ...root.custom, sitePart: part };
		}
		insertTree(editor, tree, ROOT_ID, indexFor());
	};

	return {
		current,
		stored,
		label,
		removeCurrent,
		applySiteVersion,
		setScope,
		insertTemplate,
	};
}

/* ------------------------------------------------------------------ */
/* Painel de configurações: "Exibir em"                                */
/* ------------------------------------------------------------------ */

/** Bloco mostrado no topo das configurações do cabeçalho/rodapé selecionado. */
export function SitePartCard({ part }: { part: SitePart }) {
	const { current, label, setScope, removeCurrent } = useSitePart(part);
	const openPicker = useSectionPicker((s) => s.open);
	if (!current) return null;
	const scope: PartScope = current.isSite ? "site" : "page";
	const lower = label.toLowerCase();

	const options: { value: PartScope; title: string; icon: typeof Files }[] = [
		{ value: "site", title: "Todas as páginas", icon: Files },
		{ value: "page", title: "Só nesta página", icon: FileText },
	];

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-3">
			<span className="text-[11px] font-medium text-muted-foreground">
				Exibir em
			</span>
			<div className="grid grid-cols-2 gap-1.5">
				{options.map(({ value, title, icon: Icon }) => (
					<button
						key={value}
						type="button"
						onClick={() => setScope(value)}
						className={cn(
							"flex flex-col items-center gap-1.5 rounded-md border px-2 py-2.5 text-[11px] transition-colors",
							scope === value
								? "border-primary bg-primary/10 text-foreground"
								: "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
						)}
					>
						<Icon className="size-4" />
						{title}
					</button>
				))}
			</div>
			<p className="text-[11px] leading-relaxed text-muted-foreground">
				{scope === "site"
					? `Este é o ${lower} do site. O que você mudar aqui aparece em todas as páginas que usam o padrão.`
					: `Este ${lower} existe só nesta página. As outras páginas continuam com o ${lower} do site.`}
			</p>
			<div className="grid grid-cols-2 gap-1.5">
				<button
					type="button"
					onClick={() => openPicker(undefined, PART_CATEGORY[part])}
					className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-border text-[11px] hover:bg-accent"
				>
					<LayoutTemplate className="size-3.5" /> Trocar modelo
				</button>
				<button
					type="button"
					onClick={removeCurrent}
					className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-border text-[11px] text-muted-foreground hover:border-destructive/50 hover:text-destructive"
				>
					<Trash2 className="size-3.5" /> Remover da página
				</button>
			</div>
		</div>
	);
}
