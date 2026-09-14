import { Pipette, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { cn } from "#/lib/utils";
import { useEditorUI } from "../editor/store.ts";
import { Field } from "./field.tsx";
import { useField } from "./use-field.ts";

const CHECKER =
	"repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%) 50% / 8px 8px";

export function ColorField({
	path,
	label,
	hint,
	allowEmpty,
}: {
	path: string;
	label: string;
	hint?: string;
	/** Permite "sem cor" (herda do CSS). */
	allowEmpty?: boolean;
}) {
	const f = useField<string>(path);
	return (
		<Field
			label={label}
			hint={hint}
			inline
			responsive={f.responsive}
			overridden={f.overridden}
			onReset={f.reset}
		>
			<ColorInput
				value={f.value}
				onChange={(v, t) => f.set(v, { throttle: t })}
				allowEmpty={allowEmpty}
			/>
		</Field>
	);
}

export function ColorInput({
	value,
	onChange,
	allowEmpty,
}: {
	value: string | undefined;
	onChange: (value: string, throttle?: boolean) => void;
	allowEmpty?: boolean;
}) {
	const favorites = useEditorUI((s) => s.favoriteColors);
	const addFavorite = useEditorUI((s) => s.addFavoriteColor);
	const removeFavorite = useEditorUI((s) => s.removeFavoriteColor);
	const [hex, setHex] = useState(value ?? "");
	useEffect(() => setHex(value ?? ""), [value]);

	const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

	const pickFromScreen = async () => {
		try {
			// biome-ignore lint/suspicious/noExplicitAny: EyeDropper ainda não está no lib.dom
			const dropper = new (window as any).EyeDropper();
			const result = await dropper.open();
			onChange(result.sRGBHex);
		} catch {
			// usuário cancelou
		}
	};

	const commitHex = (raw: string) => {
		const v = raw.trim();
		if (!v && allowEmpty) return onChange("");
		const normalized = v.startsWith("#") ? v : `#${v}`;
		if (
			/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(normalized)
		) {
			onChange(normalized.toLowerCase());
		}
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="flex h-8 w-[118px] items-center gap-2 rounded-md border border-input px-1.5 text-left text-[11px] hover:bg-accent/50"
				>
					<span
						className="size-5 shrink-0 overflow-hidden rounded-sm border border-border"
						style={{ background: CHECKER }}
					>
						<span
							className="block size-full"
							style={{ background: value || "transparent" }}
						/>
					</span>
					<span className="truncate font-mono text-muted-foreground">
						{value || "nenhuma"}
					</span>
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-60 p-3" align="end">
				<div className="flex flex-col gap-3">
					<HexAlphaColorPicker
						color={value || "#000000ff"}
						onChange={(c) => onChange(c, true)}
						style={{ width: "100%", height: 160 }}
					/>
					<div className="flex items-center gap-2">
						<input
							className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
							value={hex}
							onChange={(e) => setHex(e.target.value)}
							onBlur={(e) => commitHex(e.target.value)}
							onKeyDown={(e) =>
								e.key === "Enter" &&
								commitHex((e.target as HTMLInputElement).value)
							}
						/>
						{hasEyeDropper ? (
							<button
								type="button"
								title="Conta-gotas"
								onClick={pickFromScreen}
								className="flex size-8 items-center justify-center rounded-md border border-input hover:bg-accent"
							>
								<Pipette className="size-3.5" />
							</button>
						) : null}
						{allowEmpty ? (
							<button
								type="button"
								title="Sem cor"
								onClick={() => onChange("")}
								className="flex size-8 items-center justify-center rounded-md border border-input hover:bg-accent"
							>
								<X className="size-3.5" />
							</button>
						) : null}
					</div>
					<div className="flex flex-wrap gap-1.5">
						{favorites.map((c) => (
							<button
								key={c}
								type="button"
								title={`${c} (botão direito remove)`}
								onClick={() => onChange(c)}
								onContextMenu={(e) => {
									e.preventDefault();
									removeFavorite(c);
								}}
								className={cn(
									"size-6 overflow-hidden rounded border border-border",
									c === value && "ring-2 ring-primary",
								)}
								style={{ background: CHECKER }}
							>
								<span className="block size-full" style={{ background: c }} />
							</button>
						))}
						{value ? (
							<button
								type="button"
								title="Salvar cor"
								onClick={() => addFavorite(value)}
								className="flex size-6 items-center justify-center rounded border border-dashed border-border text-muted-foreground hover:text-foreground"
							>
								<Plus className="size-3" />
							</button>
						) : null}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
