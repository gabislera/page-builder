import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, Trash2, Upload, Video, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { cn } from "#/lib/utils";
import { useEditorContext } from "../editor/context.tsx";
import { DebouncedInput } from "./inputs.tsx";

type Accept = "image" | "video" | "svg";

const ACCEPT_ATTR: Record<Accept, string> = {
	image: "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif",
	video: "video/mp4,video/webm",
	svg: "image/svg+xml",
};

const matches = (mime: string, accept: Accept) =>
	accept === "svg" ? mime === "image/svg+xml" : mime.startsWith(`${accept}/`);

export function MediaInput({
	value,
	onChange,
	accept,
}: {
	value: string;
	onChange: (value: string) => void;
	accept: Accept;
}) {
	const [open, setOpen] = useState(false);
	return (
		<div className="flex flex-col gap-2">
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<button
						type="button"
						className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-[repeating-conic-gradient(#27272a_0%_25%,#1f1f23_0%_50%)] bg-[length:12px_12px] hover:border-primary"
					>
						{value ? (
							accept === "video" ? (
								<video
									src={value}
									className="h-full w-full object-contain"
									muted
								/>
							) : (
								<img
									src={value}
									alt=""
									className="h-full w-full object-contain"
								/>
							)
						) : (
							<span className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
								{accept === "video" ? (
									<Video className="size-5" />
								) : (
									<ImageIcon className="size-5" />
								)}
								Escolher da biblioteca
							</span>
						)}
						<span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[10px] opacity-0 group-hover:opacity-100">
							Trocar
						</span>
					</button>
				</DialogTrigger>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Biblioteca de mídia</DialogTitle>
					</DialogHeader>
					<AssetLibrary
						accept={accept}
						selected={value}
						onSelect={(url) => {
							onChange(url);
							setOpen(false);
						}}
					/>
				</DialogContent>
			</Dialog>
			<div className="flex items-center gap-1.5">
				<DebouncedInput
					value={value}
					onChange={onChange}
					placeholder="ou cole uma URL"
				/>
				{value ? (
					<button
						type="button"
						title="Remover"
						onClick={() => onChange("")}
						className="flex size-8 shrink-0 items-center justify-center rounded-md border border-input hover:bg-accent"
					>
						<X className="size-3.5" />
					</button>
				) : null}
			</div>
		</div>
	);
}

function AssetLibrary({
	accept,
	selected,
	onSelect,
}: {
	accept: Accept;
	selected: string;
	onSelect: (url: string) => void;
}) {
	const { projectId, services } = useEditorContext();
	const queryClient = useQueryClient();
	const inputRef = useRef<HTMLInputElement>(null);
	const queryKey = ["assets", projectId];

	const assets = useQuery({
		queryKey,
		queryFn: services.listAssets,
	});

	const upload = useMutation({
		mutationFn: services.uploadAsset,
		onSuccess: (asset) => {
			queryClient.invalidateQueries({ queryKey });
			onSelect(asset.url);
		},
		onError: (e) => toast.error(e.message),
	});

	const remove = useMutation({
		mutationFn: services.deleteAsset,
		onSuccess: () => queryClient.invalidateQueries({ queryKey }),
	});

	const handleFiles = (files: FileList | null) => {
		const file = files?.[0];
		if (!file) return;
		if (!matches(file.type, accept)) {
			toast.error("Tipo de arquivo não aceito aqui");
			return;
		}
		upload.mutate(file);
	};

	const items = (assets.data ?? []).filter((a) => matches(a.mimeType, accept));

	return (
		<div className="flex flex-col gap-4">
			<label
				onDragOver={(e) => e.preventDefault()}
				onDrop={(e) => {
					e.preventDefault();
					handleFiles(e.dataTransfer.files);
				}}
				className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input p-6 text-sm text-muted-foreground hover:border-primary"
			>
				{upload.isPending ? (
					<Loader2 className="size-5 animate-spin" />
				) : (
					<Upload className="size-5" />
				)}
				<span>
					{upload.isPending
						? "Enviando..."
						: "Arraste um arquivo ou clique para enviar"}
				</span>
				<input
					ref={inputRef}
					type="file"
					accept={ACCEPT_ATTR[accept]}
					className="hidden"
					onChange={(e) => handleFiles(e.target.files)}
				/>
			</label>
			<div className="grid max-h-[50vh] grid-cols-4 gap-3 overflow-y-auto">
				{assets.isLoading ? (
					<p className="col-span-4 text-sm text-muted-foreground">
						Carregando...
					</p>
				) : null}
				{!assets.isLoading && items.length === 0 ? (
					<p className="col-span-4 text-sm text-muted-foreground">
						Nenhum arquivo ainda.
					</p>
				) : null}
				{items.map((a) => (
					<div
						key={a.id}
						className={cn(
							"group relative aspect-square overflow-hidden rounded-md border border-border bg-muted",
							selected === a.url && "ring-2 ring-primary",
						)}
					>
						<button
							type="button"
							className="size-full"
							onClick={() => onSelect(a.url)}
							title={a.name}
						>
							{a.mimeType.startsWith("video/") ? (
								<video src={a.url} className="size-full object-cover" muted />
							) : (
								<img
									src={a.url}
									alt={a.name}
									className="size-full object-contain"
									loading="lazy"
								/>
							)}
						</button>
						<Button
							size="icon"
							variant="destructive"
							className="absolute top-1 right-1 size-7 opacity-0 group-hover:opacity-100"
							onClick={() => remove.mutate(a.id)}
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
