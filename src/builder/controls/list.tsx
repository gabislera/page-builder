import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { getPath } from "../core/path.ts";
import { Field } from "./field.tsx";
import { useNodeProps } from "./use-field.ts";

/** List items need a stable id for drag-and-drop. */
export type ListItem = { id: string };

export const newItemId = () => Math.random().toString(36).slice(2, 10);

type ListFieldProps<T extends ListItem> = {
  /** Path of the array in props (e.g. "items"). */
  path: string;
  label: string;
  /** Creates a new item. */
  create: () => T;
  /** Title shown in the item's collapsed header. */
  itemLabel: (item: T, index: number) => string;
  /**
   * Fields of an item. `itemPath` is the item's full path
   * (e.g. "items.2"), for use with other controls: `${itemPath}.label`.
   */
  renderItem: (itemPath: string, item: T, index: number) => ReactNode;
  addLabel?: string;
  min?: number;
  max?: number;
};

/**
 * List editor bound to a prop: add, duplicate, remove, and
 * reorder by dragging. Each item expands/collapses to show its fields.
 */
export function ListField<T extends ListItem>({ path, label, renderItem, ...rest }: ListFieldProps<T>) {
  const { props, update } = useNodeProps<Record<string, unknown>>();
  const items = getPath<T[]>(props, path) ?? [];
  const mutate = (fn: (list: T[]) => T[]) =>
    update((draft) => {
      const keys = path.split(".");
      let target = draft as Record<string, unknown>;
      for (const k of keys.slice(0, -1)) target = target[k] as Record<string, unknown>;
      const last = keys[keys.length - 1];
      target[last] = fn([...((target[last] as T[]) ?? [])]);
    });
  return (
    <Field label={label}>
      <ListEditor
        {...rest}
        items={items}
        onChange={mutate}
        renderItem={(item, index) => renderItem(`${path}.${index}`, item, index)}
      />
    </Field>
  );
}

export type ListEditorProps<T extends ListItem> = {
  items: T[];
  /** Receives a function that turns the current list into the next one. */
  onChange: (fn: (list: T[]) => T[]) => void;
  create: () => T;
  itemLabel: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Copy of an item (default: clone with a new id). */
  duplicate?: (item: T) => T;
  /** Called when an item is opened. */
  onOpen?: (item: T, index: number) => void;
  /** Detail to the right of the title (e.g. "3 campos"). */
  itemMeta?: (item: T, index: number) => ReactNode;
  addLabel?: string;
  min?: number;
  max?: number;
  /** Item look: "card" (default) or "section" (more emphasized). */
  variant?: "card" | "section";
};

/** Editable list with no direct binding to props (controlled). */
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
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
              onRemove={() => onChange((list) => list.filter((i) => i.id !== item.id))}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
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
      <div className={cn("flex items-center gap-1 px-1", variant === "section" ? "h-10" : "h-8")}>
        <button
          type="button"
          className="flex size-6 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1 text-left text-xs">
          <ChevronRight className={cn("size-3 shrink-0 transition-transform", open && "rotate-90")} />
          <span className={cn("truncate", variant === "section" && "font-medium")}>{title}</span>
          {meta ? <span className="ml-auto shrink-0 pl-1 text-[10px] text-muted-foreground">{meta}</span> : null}
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
        <div className={cn("flex flex-col gap-3 border-t border-border", variant === "section" ? "p-2.5" : "p-3")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
