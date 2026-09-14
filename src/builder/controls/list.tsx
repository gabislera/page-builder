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
 * Editor de lista: adicionar, duplicar, remover e reordenar arrastando.
 * Cada item abre/fecha para mostrar seus campos.
 */
export function ListField<T extends ListItem>({
	path,
	label,
	create,
	itemLabel,
	renderItem,
	addLabel = "Adicionar item",
	min = 0,
	max = 50,
}: ListFieldProps<T>) {
	const { props, update } = useNodeProps<Record<string, unknown>>();
	const items = getPath<T[]>(props, path) ?? [];
	const [open, setOpen] = useState<string | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	);

	const mutate = (fn: (list: T[]) => T[]) =>
		update((draft) => {
			const keys = path.split(".");
			let target = draft as Record<string, unknown>;
			for (const k of keys.slice(0, -1))
				target = target[k] as Record<string, unknown>;
			const last = keys[keys.length - 1];
			target[last] = fn([...((target[last] as T[]) ?? [])]);
		});

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		mutate((list) => {
			const from = list.findIndex((i) => i.id === active.id);
			const to = list.findIndex((i) => i.id === over.id);
			return arrayMove(list, from, to);
		});
	};

	return (
		<Field label={label}>
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
								open={open === item.id}
								onToggle={() => setOpen(open === item.id ? null : item.id)}
								canRemove={items.length > min}
								canDuplicate={items.length < max}
								onRemove={() =>
									mutate((list) => list.filter((i) => i.id !== item.id))
								}
								onDuplicate={() =>
									mutate((list) => {
										const copy = { ...structuredClone(item), id: newItemId() };
										list.splice(index + 1, 0, copy);
										return list;
									})
								}
							>
								{renderItem(`${path}.${index}`, item, index)}
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
							mutate((list) => [...list, item]);
							setOpen(item.id);
						}}
					>
						<Plus className="size-3.5" /> {addLabel}
					</Button>
				) : null}
			</div>
		</Field>
	);
}

function SortableItem({
	id,
	title,
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
				"rounded-md border border-border bg-card",
				isDragging && "z-10 opacity-80 shadow-lg",
			)}
		>
			<div className="flex h-8 items-center gap-1 px-1">
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
					<span className="truncate">{title}</span>
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
				<div className="flex flex-col gap-3 border-t border-border p-3">
					{children}
				</div>
			) : null}
		</div>
	);
}
