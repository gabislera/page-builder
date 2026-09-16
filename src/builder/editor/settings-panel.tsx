import { NodeProvider, useEditor } from "@craftjs/core";
import { Globe, MousePointer2, Unlink } from "lucide-react";
import { createElement } from "react";
import { Button } from "#/components/ui/button";
import { Switch } from "#/components/ui/switch";
import { DebouncedInput } from "../controls/inputs.tsx";
import { ROOT_ID } from "../core/tree.ts";
import { COMPONENTS } from "../registry.ts";
import { unlinkGlobal } from "./node-actions.ts";
import { SitePartCard } from "./site-parts.tsx";

/** Painel direito: configurações do nó selecionado. */
export function SettingsPanel() {
	const editor = useEditor((state) => {
		const [id] = state.events.selected;
		if (!id || !state.nodes[id]) return { selected: null };
		const node = state.nodes[id];
		return {
			selected: {
				id,
				type: node.data.name,
				displayName: node.data.displayName,
				customName: (node.data.custom?.displayName as string) ?? "",
				isTopLevel: node.data.parent === ROOT_ID,
				isGlobal: Boolean(node.data.custom?.isGlobal),
				sitePart: node.data.custom?.sitePart as string | undefined,
				isSiteBlock: node.data.name === "Header" || node.data.name === "Footer",
				settings: node.related?.settings,
			},
		};
	});
	const { selected, actions } = editor;

	if (!selected) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
				<MousePointer2 className="size-6" />
				<p className="text-xs">Selecione um elemento no canvas para editar.</p>
			</div>
		);
	}

	const def = COMPONENTS[selected.type];
	const Icon = def?.icon;

	return (
		<div className="flex flex-col">
			<div className="flex flex-col gap-3 border-b border-border p-4">
				<div className="flex items-center gap-2">
					{Icon ? <Icon className="size-4 text-primary" /> : null}
					<span className="text-xs font-semibold">{selected.displayName}</span>
				</div>
				{selected.id !== ROOT_ID ? (
					<DebouncedInput
						value={selected.customName}
						placeholder={`Nome (ex.: ${selected.displayName} principal)`}
						onChange={(v) =>
							actions.setCustom(
								selected.id,
								(custom: Record<string, unknown>) => {
									custom.displayName = v || undefined;
								},
							)
						}
					/>
				) : null}
				{selected.isSiteBlock ? (
					<SitePartCard
						part={selected.type === "Header" ? "header" : "footer"}
					/>
				) : selected.isTopLevel ? (
					<GlobalToggle
						isGlobal={selected.isGlobal}
						onChange={(v) =>
							actions.setCustom(
								selected.id,
								(custom: Record<string, unknown>) => {
									custom.isGlobal = v;
								},
							)
						}
						onUnlink={() => unlinkGlobal(editor, selected.id)}
					/>
				) : null}
			</div>
			{selected.settings ? (
				<NodeProvider key={selected.id} id={selected.id}>
					{createElement(selected.settings)}
				</NodeProvider>
			) : null}
		</div>
	);
}

function GlobalToggle({
	isGlobal,
	onChange,
	onUnlink,
}: {
	isGlobal: boolean;
	onChange: (v: boolean) => void;
	onUnlink: () => void;
}) {
	return (
		<div className="flex flex-col gap-2 rounded-md border border-border p-3">
			<label className="flex items-center justify-between gap-2">
				<span className="flex items-center gap-1.5 text-xs font-medium">
					<Globe className="size-3.5 text-sky-400" /> Seção global
				</span>
				<Switch checked={isGlobal} onCheckedChange={onChange} />
			</label>
			<p className="text-[11px] text-muted-foreground">
				{isGlobal
					? "Alterações aparecem em todas as páginas que usam esta seção."
					: "Reutilize esta seção em outras páginas do projeto."}
			</p>
			{isGlobal ? (
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-xs"
					onClick={onUnlink}
				>
					<Unlink className="size-3" /> Desvincular (virar cópia local)
				</Button>
			) : null}
		</div>
	);
}

/** Configurações da página (nó ROOT) no painel esquerdo. */
export function PageStylesPanel() {
	const { settings } = useEditor((state) => ({
		settings: state.nodes[ROOT_ID]?.related?.settings,
	}));
	if (!settings) return null;
	return <NodeProvider id={ROOT_ID}>{createElement(settings)}</NodeProvider>;
}
