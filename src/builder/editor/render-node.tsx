import { useEditor, useNode } from "@craftjs/core";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpToLine,
	Copy,
	Globe,
	GripVertical,
	Plus,
	Trash2,
} from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { UI_ACCENT, UI_ACCENT_FG } from "#/lib/brand";
import { TOP_BAR_TYPE } from "../core/node-helpers.ts";
import { ROOT_ID } from "../core/tree.ts";
import { duplicateNode, moveSection } from "./node-actions.ts";
import { useSectionPicker } from "./section-picker-store.ts";

type Rect = { top: number; left: number; width: number; height: number };

/**
 * Envolve cada nó no canvas: aplica as classes de hover/seleção e desenha a
 * barra de ações. A barra vive dentro do iframe (portal no body dele), então
 * acompanha rolagem e zoom sem cálculo de coordenadas entre documentos.
 */
export function RenderNode({ render }: { render: ReactNode }) {
	const editor = useEditor();
	const {
		id,
		dom,
		name,
		isHover,
		isSelected,
		parent,
		custom,
		isDeletable,
		isDraggable,
		connectors,
	} = useNode((node) => ({
		dom: node.dom,
		name: (node.data.custom?.displayName as string) || node.data.displayName,
		isHover: node.events.hovered,
		isSelected: node.events.selected,
		parent: node.data.parent,
		custom: node.data.custom as Record<string, unknown>,
		isDeletable: node.data.parent !== null && !node.data.custom?.notDeletable,
		isDraggable: node.data.parent !== null && node.data.name !== "Page",
	}));

	useEffect(() => {
		if (!dom || id === ROOT_ID) return;
		dom.classList.toggle("pb-hover", isHover && !isSelected);
		dom.classList.toggle("pb-selected", isSelected);
	}, [dom, isHover, isSelected, id]);

	const showBar = id !== ROOT_ID && dom && (isHover || isSelected);
	const isTopLevel = parent === ROOT_ID;

	return (
		<>
			{render}
			{showBar
				? createPortal(
						<NodeBar
							id={id}
							dom={dom}
							name={name}
							selected={isSelected}
							isTopLevel={isTopLevel}
							isGlobal={Boolean(custom?.isGlobal || custom?.sitePart)}
							canDelete={isDeletable && editor.query.node(id).isDeletable()}
							canDrag={isDraggable}
							canDuplicate={!custom?.notDuplicable}
							dragRef={(el) => {
								if (el) connectors.drag(el);
							}}
						/>,
						dom.ownerDocument.body,
					)
				: null}
		</>
	);
}

function useRect(dom: HTMLElement): Rect {
	const read = useCallback((): Rect => {
		const r = dom.getBoundingClientRect();
		const win = dom.ownerDocument.defaultView;
		return {
			top: r.top + (win?.scrollY ?? 0),
			left: r.left + (win?.scrollX ?? 0),
			width: r.width,
			height: r.height,
		};
	}, [dom]);
	const [rect, setRect] = useState<Rect>(read);

	useLayoutEffect(() => {
		const update = () => setRect(read());
		update();
		const ro = new ResizeObserver(update);
		ro.observe(dom);
		ro.observe(dom.ownerDocument.body);
		const win = dom.ownerDocument.defaultView;
		win?.addEventListener("resize", update);
		return () => {
			ro.disconnect();
			win?.removeEventListener("resize", update);
		};
	}, [dom, read]);
	return rect;
}

const bar: React.CSSProperties = {
	position: "absolute",
	zIndex: 2147483000,
	display: "flex",
	alignItems: "center",
	gap: 2,
	height: 24,
	padding: "0 4px",
	borderRadius: "4px 4px 0 0",
	background: UI_ACCENT,
	color: UI_ACCENT_FG,
	font: "600 11px/1 Inter, system-ui, sans-serif",
	whiteSpace: "nowrap",
	pointerEvents: "auto",
	boxShadow: "0 2px 6px rgba(0,0,0,.2)",
};

const iconBtn: React.CSSProperties = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	width: 20,
	height: 20,
	border: 0,
	borderRadius: 3,
	background: "transparent",
	color: "inherit",
	cursor: "pointer",
	padding: 0,
};

function NodeBar({
	id,
	dom,
	name,
	selected,
	isTopLevel,
	isGlobal,
	canDelete,
	canDrag,
	canDuplicate,
	dragRef,
}: {
	id: string;
	dom: HTMLElement;
	name: string;
	selected: boolean;
	isTopLevel: boolean;
	isGlobal: boolean;
	canDelete: boolean;
	canDrag: boolean;
	canDuplicate: boolean;
	dragRef: (el: HTMLElement | null) => void;
}) {
	const editor = useEditor();
	const openPicker = useSectionPicker((s) => s.open);
	const rect = useRect(dom);
	const parentId = editor.query.node(id).get()?.data.parent;
	const top = Math.max(0, rect.top - 24);

	const stop = (fn: () => void) => (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		fn();
	};

	// a barra de aviso tem lugar fixo (topo): sem mover nem inserir abaixo
	const isTopBar = editor.query.node(id).get()?.data.name === TOP_BAR_TYPE;
	const indexInRoot = isTopLevel
		? editor.query.node(ROOT_ID).get().data.nodes.indexOf(id)
		: -1;

	return (
		<>
			<div
				style={{
					...bar,
					top,
					left: rect.left,
					background: isGlobal ? "#0ea5e9" : bar.background,
				}}
				onMouseDown={(e) => e.stopPropagation()}
			>
				{canDrag ? (
					<span
						ref={dragRef}
						title="Arrastar"
						style={{ ...iconBtn, cursor: "grab" }}
					>
						<GripVertical size={13} />
					</span>
				) : null}
				<span
					style={{ padding: "0 4px", cursor: "pointer" }}
					onMouseDown={stop(() => editor.actions.selectNode(id))}
				>
					{isGlobal ? (
						<Globe
							size={11}
							style={{ display: "inline", marginRight: 4, verticalAlign: -1 }}
						/>
					) : null}
					{name}
				</span>
				{selected ? (
					<>
						{parentId && parentId !== ROOT_ID ? (
							<button
								type="button"
								title="Selecionar pai"
								style={iconBtn}
								onMouseDown={stop(() => editor.actions.selectNode(parentId))}
							>
								<ArrowUpToLine size={13} />
							</button>
						) : null}
						{isTopLevel && !isTopBar ? (
							<>
								<button
									type="button"
									title="Mover para cima"
									style={iconBtn}
									onMouseDown={stop(() => moveSection(editor, id, -1))}
								>
									<ArrowUp size={13} />
								</button>
								<button
									type="button"
									title="Mover para baixo"
									style={iconBtn}
									onMouseDown={stop(() => moveSection(editor, id, 1))}
								>
									<ArrowDown size={13} />
								</button>
							</>
						) : null}
						{canDuplicate && !isGlobal ? (
							<button
								type="button"
								title="Duplicar"
								style={iconBtn}
								onMouseDown={stop(() => duplicateNode(editor, id))}
							>
								<Copy size={12} />
							</button>
						) : null}
						{canDelete ? (
							<button
								type="button"
								title="Excluir"
								style={iconBtn}
								onMouseDown={stop(() => editor.actions.delete(id))}
							>
								<Trash2 size={12} />
							</button>
						) : null}
					</>
				) : null}
			</div>
			{isTopLevel && selected && !isTopBar ? (
				<button
					type="button"
					title="Adicionar seção abaixo"
					onMouseDown={stop(() => openPicker(indexInRoot + 1))}
					style={{
						...iconBtn,
						position: "absolute",
						zIndex: 2147483000,
						top: rect.top + rect.height - 14,
						left: rect.left + rect.width / 2 - 14,
						width: 28,
						height: 28,
						borderRadius: 999,
						background: UI_ACCENT,
						color: UI_ACCENT_FG,
						boxShadow: `0 4px 12px color-mix(in srgb, ${UI_ACCENT} 45%, transparent)`,
					}}
				>
					<Plus size={16} />
				</button>
			) : null}
		</>
	);
}
