import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderOpen, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { createProject, listProjects } from "#/server/projects";

export const Route = createFileRoute("/_app/projects/")({
	component: ProjectsPage,
});

function ProjectsPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const projects = useQuery({
		queryKey: ["projects"],
		queryFn: () => listProjects(),
	});
	const create = useMutation({
		mutationFn: () => createProject({ data: { name } }),
		onSuccess: (p) => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			navigate({ to: "/projects/$projectId", params: { projectId: p.id } });
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Projetos</h1>
					<p className="text-sm text-muted-foreground">
						Cada projeto agrupa páginas, seções globais e arquivos.
					</p>
				</div>
				<form
					className="flex gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						if (name.trim().length >= 2) create.mutate();
					}}
				>
					<Input
						placeholder="Nome do novo projeto"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-64"
					/>
					<Button
						type="submit"
						disabled={create.isPending || name.trim().length < 2}
					>
						{create.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Plus className="size-4" />
						)}
						Criar
					</Button>
				</form>
			</div>
			{projects.isLoading ? (
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			) : null}
			{projects.data?.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
					Crie seu primeiro projeto para começar.
				</p>
			) : null}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{projects.data?.map((p) => (
					<Link
						key={p.id}
						to="/projects/$projectId"
						params={{ projectId: p.id }}
						className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary"
					>
						<FolderOpen className="size-5 text-primary" />
						<div className="flex flex-col">
							<span className="font-medium">{p.name}</span>
							<span className="text-xs text-muted-foreground">/{p.slug}</span>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
