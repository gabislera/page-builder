import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Copy,
	ExternalLink,
	Link2,
	Loader2,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { confirm } from "#/components/confirm-dialog";
import { NewPageDialog } from "#/components/new-page-dialog";
import { PageAddressDialog } from "#/components/page-address-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { deletePage, duplicatePage, listPages } from "#/server/pages";
import { listProjects } from "#/server/projects";

export const Route = createFileRoute("/_app/projects/$projectId")({
	component: ProjectPages,
});

function ProjectPages() {
	const { projectId } = Route.useParams();
	const queryClient = useQueryClient();
	const projects = useQuery({
		queryKey: ["projects"],
		queryFn: () => listProjects(),
	});
	const project = projects.data?.find((p) => p.id === projectId);
	const pages = useQuery({
		queryKey: ["pages", projectId],
		queryFn: () => listPages({ data: { projectId } }),
	});
	const [addressOf, setAddressOf] = useState<{
		id: string;
		name: string;
		slug: string;
		status: string;
	} | null>(null);
	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: ["pages", projectId] });

	const duplicate = useMutation({
		mutationFn: (pageId: string) => duplicatePage({ data: { pageId } }),
		onSuccess: refresh,
		onError: (e) => toast.error(e.message),
	});
	const remove = useMutation({
		mutationFn: (pageId: string) => deletePage({ data: { pageId } }),
		onSuccess: refresh,
		onError: (e) => toast.error(e.message),
	});

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-end justify-between gap-4">
				<div>
					<Link
						to="/projects"
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						← Projetos
					</Link>
					<h1 className="text-2xl font-semibold">{project?.name ?? "..."}</h1>
				</div>
				<NewPageDialog
					projectId={projectId}
					projectSlug={project?.slug ?? ""}
				/>
			</div>
			{pages.isLoading ? (
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			) : null}
			{pages.data?.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
					Nenhuma página ainda.
				</p>
			) : null}
			<div className="overflow-hidden rounded-xl border border-border">
				{pages.data?.map((p) => (
					<div
						key={p.id}
						className="flex items-center gap-4 border-b border-border bg-card px-5 py-3 last:border-0"
					>
						<div className="flex min-w-0 flex-1 flex-col">
							<Link
								to="/editor/$pageId"
								params={{ pageId: p.id }}
								className="truncate font-medium hover:text-primary"
							>
								{p.name}
							</Link>
							<span className="text-xs text-muted-foreground">/{p.slug}</span>
						</div>
						<Badge variant={p.status === "published" ? "default" : "secondary"}>
							{p.status === "published" ? "Publicada" : "Rascunho"}
						</Badge>
						<span className="w-36 text-right text-xs text-muted-foreground">
							{new Date(p.updatedAt).toLocaleString("pt-BR", {
								dateStyle: "short",
								timeStyle: "short",
							})}
						</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="icon" variant="ghost" className="size-8">
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link to="/editor/$pageId" params={{ pageId: p.id }}>
										<Pencil className="size-4" /> Editar
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setAddressOf(p)}>
									<Link2 className="size-4" /> Nome e endereço
								</DropdownMenuItem>
								{p.status === "published" && project ? (
									<DropdownMenuItem asChild>
										<a
											href={`/p/${project.slug}/${p.slug}`}
											target="_blank"
											rel="noreferrer"
										>
											<ExternalLink className="size-4" /> Abrir publicada
										</a>
									</DropdownMenuItem>
								) : null}
								<DropdownMenuItem onClick={() => duplicate.mutate(p.id)}>
									<Copy className="size-4" /> Duplicar
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-destructive"
									onClick={async () => {
										const ok = await confirm({
											title: "Excluir página?",
											description: (
												<>
													A página <strong>{p.name}</strong> será excluída
													{p.status === "published" ? " e sairá do ar" : ""}.
													Essa ação não pode ser desfeita.
												</>
											),
											confirmText: "Excluir página",
											destructive: true,
										});
										if (ok) remove.mutate(p.id);
									}}
								>
									<Trash2 className="size-4" /> Excluir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				))}
			</div>
			<PageAddressDialog
				page={addressOf}
				projectSlug={project?.slug ?? ""}
				onClose={() => setAddressOf(null)}
				onSaved={refresh}
			/>
		</div>
	);
}
