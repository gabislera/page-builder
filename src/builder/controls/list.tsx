import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { getPath } from "../core/path.ts";
import { Field } from "./field.tsx";
import { useNodeProps } from "./use-field.ts";

/** Itens de lista precisam de um id estável para o drag-and-drop. */
export type ListItem = { id: string };

export const newItemId = () => Math.random().toString(36).slice(2, 10);

type ListFieldProps<T extends ListItem> = {
	/** Caminho do array nas props (ex.: "items"). */
	path: string;
	label: string;
	/** Cria um item novo. */
	create: () => T;
	/** Título mostrado no cabeçalho recolhido do item. */
	itemLabel: (item: T, index: number) => string;
	/**
	 * Campos de um item. `itemPath` é o caminho completo do item
	 * (ex.: "items.2"), para usar com os demais controles: `${itemPath}.label`.
	 */
	renderItem: (itemPath: string, item: T, index: number) => ReactNode;
	addLabel?: string;
	min?: number;
	max?: number;
};

/**
 * Editor de lista ligado a uma prop: adicionar, duplicar, remover e
 * reordenar arrastando. Cada item abre/fecha para mostrar seus campos.
 */
export function ListField<T extends ListItem>({
	path,
	label,
	renderItem,
	...rest
}: ListFieldProps<T>) {
	const { props, update } = useNodeProps<Record<string, unknown>>();
	const items = getPath<T[]>(props, path) ?? [];
	const mutate = (fn: (list: T[]) => T[]) =>
		update((draft) => {
			const keys = path.split(".");
			let target = draft as Record<string, unknown>;
			for (const k of keys.slice(0, -1))
				target = target[k] as Record<string, unknown>;
			const last = keys[keys.length - 1];
			target[last] = fn([...((target[last] as T[]) ?? [])]);
		});
	return (
		<Field label={label}>
			<ListEditor
				{...rest}
				items={items}
				onChange={mutate}
				renderItem={(item, index) =>
					renderItem(`${path}.${index}`, item, index)
				}
			/>
		</Field>
	);
}

export type ListEditorProps<T extends ListItem> = {
	items: T[];
	/** Recebe uma função que transforma a lista atual na nova. */
	onChange: (fn: (list: T[]) => T[]) => void;
	create: () => T;
	itemLabel: (item: T, index: number) => string;
	renderItem: (item: T, index: number) => ReactNode;
	/** Cópia de um item (padrão: clone com id novo). */
	duplicate?: (item: T) => T;
	/** Chamado quando um item é aberto. */
	onOpen?: (item: T, index: number) => void;
	/** Detalhe à direita do título (ex.: "3 campos"). */
	itemMeta?: (item: T, index: number) => ReactNode;
	addLabel?: string;
	min?: number;
	max?: number;
	/** Visual dos itens: "card" (padrão) ou "section" (mais destacado). */
	variant?: "card" | "section";
};

/** Lista editável sem ligação direta com as props (controlada). */
export function ListEditor<T extends ListItem>({
	items,
	onChange,
	create,
	itemLabel,
	renderItem,
	duplicate = (item) => ({ ...structuredClone(item), id: newItemId() }),
	onOpen,
	itemMeta,
	addLabel = "Adicionar item",
	min = 0,
	max = 50,
	variant = "card",
}: ListEditorProps<T>) {
	const [open, setOpen] = useState<string | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	);
	const toggle = (item: T, index: number) => {
		const next = open === item.id ? null : item.id;
		setOpen(next);
		if (next) onOpen?.(item, index);
	};

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		onChange((list) => {
			const from = list.findIndex((i) => i.id === active.id);
			const to = list.findIndex((i) => i.id === over.id);
			return arrayMove(list, from, to);
		});
	};

	return (
		<div className="flex flex-col gap-1.5">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={onDragEnd}
			>
				<SortableContext
					items={items.map((i) => i.id)}
					strategy={verticalListSortingStrategy}
				>
					{items.map((item, index) => (
						<SortableItem
							key={item.id}
							id={item.id}
							title={itemLabel(item, index) || `Item ${index + 1}`}
							meta={itemMeta?.(item, index)}
							variant={variant}
							open={open === item.id}
							onToggle={() => toggle(item, index)}
							canRemove={items.length > min}
							canDuplicate={items.length < max}
							onRemove={() =>
								onChange((list) => list.filter((i) => i.id !== item.id))
							}
							onDuplicate={() =>
								onChange((list) => {
									list.splice(index + 1, 0, duplicate(item));
									return list;
								})
							}
						>
							{renderItem(item, index)}
						</SortableItem>
					))}
				</SortableContext>
			</DndContext>
			{items.length < max ? (
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="h-8 text-xs"
					onClick={() => {
						const item = create();
						onChange((list) => [...list, item]);
						setOpen(item.id);
						onOpen?.(item, items.length);
					}}
				>
					<Plus className="size-3.5" /> {addLabel}
				</Button>
			) : null}
		</div>
	);
}

function SortableItem({
	id,
	title,
	meta,
	variant,
	open,
	onToggle,
	onRemove,
	onDuplicate,
	canRemove,
	canDuplicate,
	children,
}: {
	id: string;
	title: string;
	meta?: ReactNode;
	variant: "card" | "section";
	open: boolean;
	onToggle: () => void;
	onRemove: () => void;
	onDuplicate: () => void;
	canRemove: boolean;
	canDuplicate: boolean;
	children: ReactNode;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"min-w-0 rounded-md border border-border bg-card",
				variant === "section" && open && "border-primary/50",
				isDragging && "z-10 opacity-80 shadow-lg",
			)}
		>
			<div
				className={cn(
					"flex items-center gap-1 px-1",
					variant === "section" ? "h-10" : "h-8",
				)}
			>
				<button
					type="button"
					className="flex size-6 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
					{...attributes}
					{...listeners}
				>
					<GripVertical className="size-3.5" />
				</button>
				<button
					type="button"
					onClick={onToggle}
					className="flex min-w-0 flex-1 items-center gap-1 text-left text-xs"
				>
					<ChevronRight
						className={cn(
							"size-3 shrink-0 transition-transform",
							open && "rotate-90",
						)}
					/>
					<span
						className={cn("truncate", variant === "section" && "font-medium")}
					>
						{title}
					</span>
					{meta ? (
						<span className="ml-auto shrink-0 pl-1 text-[10px] text-muted-foreground">
							{meta}
						</span>
					) : null}
				</button>
				{canDuplicate ? (
					<button
						type="button"
						title="Duplicar"
						onClick={onDuplicate}
						className="rounded p-1 text-muted-foreground hover:text-foreground"
					>
						<Copy className="size-3" />
					</button>
				) : null}
				{canRemove ? (
					<button
						type="button"
						title="Remover"
						onClick={onRemove}
						className="rounded p-1 text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="size-3" />
					</button>
				) : null}
			</div>
			{open ? (
				<div
					className={cn(
						"flex flex-col gap-3 border-t border-border",
						variant === "section" ? "p-2.5" : "p-3",
					)}
				>
					{children}
				</div>
			) : null}
		</div>
	);
}
