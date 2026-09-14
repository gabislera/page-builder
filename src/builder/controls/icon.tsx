import { Ban } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { cn } from "#/lib/utils";
import { ICONS, IconView } from "../core/icons.tsx";
import { Field } from "./field.tsx";
import { useField } from "./use-field.ts";

export function IconField({ path, label }: { path: string; label: string }) {
	const f = useField<string>(path);
	return (
		<Field label={label} inline>
			<IconInput value={f.value} onChange={(v) => f.set(v)} />
		</Field>
	);
}

export function IconInput({
	value,
	onChange,
	allowNone = true,
}: {
	value: string;
	onChange: (value: string) => void;
	allowNone?: boolean;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="flex h-8 w-[118px] items-center gap-2 rounded-md border border-input px-2 text-left text-[11px] hover:bg-accent/50"
				>
					{value ? (
						<IconView name={value} size={14} />
					) : (
						<Ban className="size-3.5 text-muted-foreground" />
					)}
					<span className="truncate text-muted-foreground">
						{ICONS[value]?.label ?? "Nenhum"}
					</span>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-2" align="end">
				<div className="grid grid-cols-6 gap-1">
					{allowNone ? (
						<button
							type="button"
							title="Nenhum"
							onClick={() => onChange("")}
							className={cn(
								"flex size-9 items-center justify-center rounded-md hover:bg-accent",
								!value && "bg-primary/20",
							)}
						>
							<Ban className="size-4 text-muted-foreground" />
						</button>
					) : null}
					{Object.entries(ICONS).map(([name, { label }]) => (
						<button
							key={name}
							type="button"
							title={label}
							onClick={() => onChange(name)}
							className={cn(
								"flex size-9 items-center justify-center rounded-md hover:bg-accent",
								value === name && "bg-primary/20",
							)}
						>
							<IconView name={name} size={16} />
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
