import { Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import type { ReactNode } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import type { Device } from "../core/responsive.ts";
import { useEditorUI } from "../editor/store.ts";

const DEVICE_ICON: Record<Device, typeof Monitor> = {
	desktop: Monitor,
	tablet: Tablet,
	mobile: Smartphone,
};

const DEVICE_LABEL: Record<Device, string> = {
	desktop: "Desktop",
	tablet: "Tablet",
	mobile: "Celular",
};

type FieldProps = {
	label: string;
	children: ReactNode;
	/** Mostra o indicador de dispositivo (campo responsivo). */
	responsive?: boolean;
	overridden?: boolean;
	onReset?: () => void;
	/** Label ao lado do controle em vez de acima. */
	inline?: boolean;
	hint?: string;
	className?: string;
};

export function Field({
	label,
	children,
	responsive,
	overridden,
	onReset,
	inline,
	hint,
	className,
}: FieldProps) {
	return (
		<div
			className={cn(
				inline
					? "flex items-center justify-between gap-3"
					: "flex flex-col gap-1.5",
				className,
			)}
		>
			<div className="flex min-h-5 items-center gap-1.5">
				<span className="text-[11px] font-medium text-muted-foreground">
					{label}
				</span>
				{responsive ? (
					<DeviceBadge overridden={overridden} onReset={onReset} />
				) : null}
			</div>
			<div className={cn(inline && "shrink-0")}>{children}</div>
			{hint ? (
				<p className="text-[11px] text-muted-foreground/80">{hint}</p>
			) : null}
		</div>
	);
}

function DeviceBadge({
	overridden,
	onReset,
}: {
	overridden?: boolean;
	onReset?: () => void;
}) {
	const device = useEditorUI((s) => s.device);
	const setDevice = useEditorUI((s) => s.setDevice);
	const Icon = DEVICE_ICON[device];
	const next: Record<Device, Device> = {
		desktop: "tablet",
		tablet: "mobile",
		mobile: "desktop",
	};
	return (
		<span className="flex items-center gap-0.5">
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={() => setDevice(next[device])}
						className={cn(
							"rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground",
							overridden && device !== "desktop" && "text-primary",
						)}
					>
						<Icon className="size-3" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="top">
					Editando: {DEVICE_LABEL[device]}
					{device !== "desktop" && !overridden ? " (herdado)" : ""}
				</TooltipContent>
			</Tooltip>
			{onReset ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={onReset}
							className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
						>
							<RotateCcw className="size-3" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">
						Voltar a herdar do dispositivo maior
					</TooltipContent>
				</Tooltip>
			) : null}
		</span>
	);
}

/** Grupo recolhível dentro de uma aba de configurações. */
export function Group({
	title,
	children,
	defaultOpen = true,
	action,
}: {
	title: string;
	children: ReactNode;
	defaultOpen?: boolean;
	action?: ReactNode;
}) {
	return (
		<details open={defaultOpen} className="group border-b border-border/60">
			<summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold select-none hover:bg-accent/40">
				<span>{title}</span>
				<span className="flex items-center gap-2">
					{action}
					<span className="text-muted-foreground transition-transform group-open:rotate-90">
						›
					</span>
				</span>
			</summary>
			<div className="flex flex-col gap-3 px-4 pt-1 pb-4">{children}</div>
		</details>
	);
}
