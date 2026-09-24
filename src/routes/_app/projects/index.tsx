import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderOpen, Loader2, MoreHorizontal, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectSettingsDialog } from "#/components/project-settings-dialog";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { createProject, listProjects } from "#/server/projects";

export const Route = createFileRoute("/_app/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [settingsOf, setSettingsOf] = useState<string | null>(null);
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
          <p className="text-sm text-muted-foreground">Cada projeto agrupa páginas, seções globais e arquivos.</p>
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
          <Button type="submit" disabled={create.isPending || name.trim().length < 2}>
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Criar
          </Button>
        </form>
      </div>
      {projects.isLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : null}
      {projects.data?.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Crie seu primeiro projeto para começar.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.data?.map((p) => (
          <div
            key={p.id}
            className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary"
          >
            <FolderOpen className="size-5 shrink-0 text-primary" />
            <div className="flex min-w-0 flex-col">
              <Link
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                // the link covers the whole card
                className="truncate font-medium after:absolute after:inset-0"
              >
                {p.name}
              </Link>
              <span className="truncate text-xs text-muted-foreground">/p/{p.slug}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative z-10 ml-auto size-8 shrink-0"
                  aria-label="Opções do projeto"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSettingsOf(p.id)}>
                  <Settings className="size-4" /> Configurações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <ProjectSettingsDialog
        projectId={settingsOf}
        open={Boolean(settingsOf)}
        onOpenChange={(v) => !v && setSettingsOf(null)}
      />
    </div>
  );
}
