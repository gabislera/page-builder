import { useEditor } from "@craftjs/core";
import { ChevronRight, Eye, EyeOff, Globe } from "lucide-react";
import { useState } from "react";
import { FEATURES } from "#/lib/features";
import { cn } from "#/lib/utils";
import { ROOT_ID } from "../core/tree.ts";
import { COMPONENTS } from "../registry.ts";

/** Árvore de camadas: seleção, visibilidade e navegação pela estrutura. */
export function LayersPanel() {
	const { rootChildren } = useEditor((state) => ({
		rootChildren: state.nodes[ROOT_ID]?.data.nodes ?? [],
	}));
	return (
		<div className="flex flex-col py-2">
			{rootChildren.length === 0 ? (
				<p className="p-4 text-xs text-muted-foreground">
					A página ainda não tem seções.
				</p>
			) : null}
			{rootChildren.map((id) => (
				<LayerItem key={id} id={id} depth={0} />
			))}
		</div>
	);
}

function LayerItem({ id, depth }: { id: string; depth: number }) {
	const [open, setOpen] = useState(depth === 0);
	const { node, actions, connectors, isSelected, isHovered } = useEditor(
		(state) => {
			const n = state.nodes[id];
			return {
				node: n
					? {
							type: n.data.name,
							name:
								(n.data.custom?.displayName as string) || n.data.displayName,
							children: n.data.nodes,
							hidden: n.data.hidden,
							isGlobal: Boolean(
								(FEATURES.globalSections && n.data.custom?.isGlobal) ||
									n.data.custom?.sitePart,
							),
						}
					: null,
				isSelected: state.events.selected.has(id),
				isHovered: state.events.hovered.has(id),
			};
		},
	);
	if (!node) return null;
	const Icon = COMPONENTS[node.type]?.icon;
	const hasChildren = node.children.length > 0;

	return (
		<div>
			<div
				className={cn(
					"group flex h-7 cursor-pointer items-center gap-1 pr-2 text-xs hover:bg-accent/60",
					isHovered && "bg-accent/40",
					isSelected && "bg-primary/20 text-foreground",
				)}
				style={{ paddingLeft: 8 + depth * 14 }}
				onClick={() => actions.selectNode(id)}
				ref={(el) => {
					if (el) connectors.hover(el, id);
				}}
			>
				<button
					type="button"
					className={cn(
						"flex size-4 items-center justify-center",
						!hasChildren && "invisible",
					)}
					onClick={(e) => {
						e.stopPropagation();
						setOpen(!open);
					}}
				>
					<ChevronRight
						className={cn("size-3 transition-transform", open && "rotate-90")}
					/>
				</button>
				{node.isGlobal ? (
					<Globe className="size-3.5 text-sky-400" />
				) : Icon ? (
					<Icon className="size-3.5 text-muted-foreground" />
				) : null}
				<span
					className={cn(
						"flex-1 truncate",
						node.hidden && "text-muted-foreground line-through",
					)}
				>
					{node.name}
				</span>
				<button
					type="button"
					title={node.hidden ? "Mostrar" : "Esconder no editor e na publicação"}
					className="opacity-0 group-hover:opacity-100"
					onClick={(e) => {
						e.stopPropagation();
						actions.setHidden(id, !node.hidden);
					}}
				>
					{node.hidden ? (
						<EyeOff className="size-3.5" />
					) : (
						<Eye className="size-3.5" />
					)}
				</button>
			</div>
			{open && hasChildren
				? node.children.map((child) => (
						<LayerItem key={child} id={child} depth={depth + 1} />
					))
				: null}
		</div>
	);
}
