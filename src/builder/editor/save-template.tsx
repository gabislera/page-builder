/**
 * "Salvar como modelo": guarda a seção selecionada na biblioteca do usuário
 * (aba "Meus modelos"), disponível em todos os projetos dele.
 */
import { useEditor } from "@craftjs/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { subtree } from "../core/tree.ts";
import { useEditorContext } from "./context.tsx";

const KIND: Record<string, "section" | "header" | "footer"> = {
	Section: "section",
	Header: "header",
	Footer: "footer",
};

/** Tipos que podem virar modelo (seções de topo). */
export const canSaveAsTemplate = (type: string) => type in KIND;

export function SaveAsTemplateButton({
	nodeId,
	type,
	defaultName,
}: {
	nodeId: string;
	type: string;
	defaultName: string;
}) {
	const { query } = useEditor();
	const { services } = useEditorContext();
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(defaultName);

	const save = useMutation({
		mutationFn: () =>
			services.saveSectionAsTemplate({
				name: name.trim(),
				kind: KIND[type],
				rootNodeId: nodeId,
				nodes: subtree(query.getSerializedNodes(), nodeId),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["saved-sections"] });
			toast.success("Modelo salvo", {
				description:
					'Está em "Adicionar seção" → Meus modelos, em todos os seus projetos.',
			});
			setOpen(false);
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<>
			<Button
				size="sm"
				variant="outline"
				className="h-8 text-xs"
				onClick={() => {
					setName(defaultName);
					setOpen(true);
				}}
			>
				<Bookmark className="size-3.5" /> Salvar como modelo
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Salvar como modelo</DialogTitle>
						<DialogDescription>
							Uma cópia desta seção vai para "Meus modelos" e pode ser usada em
							qualquer página dos seus projetos. Mudar a seção depois não altera
							o modelo.
						</DialogDescription>
					</DialogHeader>
					<form
						id="save-template"
						onSubmit={(e) => {
							e.preventDefault();
							if (name.trim()) save.mutate();
						}}
						className="flex flex-col gap-1.5"
					>
						<label
							htmlFor="template-name"
							className="text-xs text-muted-foreground"
						>
							Nome do modelo
						</label>
						<Input
							id="template-name"
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="ex.: Hero com vídeo"
						/>
					</form>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setOpen(false)}>
							Cancelar
						</Button>
						<Button
							type="submit"
							form="save-template"
							disabled={!name.trim() || save.isPending}
						>
							{save.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : null}
							Salvar modelo
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
