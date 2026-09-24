import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { confirm } from "#/components/confirm-dialog";
import { SlugInput } from "#/components/slug-input";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { slugify } from "#/lib/slug";
import { deleteProject, getProjectSettings, updateProject } from "#/server/projects";

const AUTO = "__auto";

/** Nome, endereço, página inicial e exclusão do projeto. */
export function ProjectSettingsDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const settings = useQuery({
    queryKey: ["project-settings", projectId],
    queryFn: () => getProjectSettings({ data: { projectId: projectId ?? "" } }),
    enabled: open && Boolean(projectId),
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [home, setHome] = useState(AUTO);
  const [notFound, setNotFound] = useState(AUTO);
  useEffect(() => {
    if (settings.data && open) {
      setName(settings.data.name);
      setSlug(settings.data.slug);
      setHome(settings.data.homePageId ?? AUTO);
      setNotFound(settings.data.notFoundPageId ?? AUTO);
    }
  }, [settings.data, open]);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
      queryClient.invalidateQueries({
        queryKey: ["project-settings", projectId],
      }),
    ]);

  const save = useMutation({
    mutationFn: () =>
      updateProject({
        data: {
          projectId: projectId ?? "",
          name: name.trim(),
          slug: slugify(slug),
          homePageId: home === AUTO ? null : home,
          notFoundPageId: notFound === AUTO ? null : notFound,
        },
      }),
    onSuccess: async () => {
      await refresh();
      toast.success("Projeto atualizado");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteProject({ data: { projectId: projectId ?? "" } }),
    onSuccess: async () => {
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto excluído");
      navigate({ to: "/projects" });
    },
    onError: (e) => toast.error(e.message),
  });

  const d = settings.data;
  const slugChanged = d && slugify(slug) !== d.slug;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurações do projeto</DialogTitle>
          <DialogDescription>O endereço do projeto é o começo do link de todas as páginas.</DialogDescription>
        </DialogHeader>
        {!d ? (
          <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
        ) : (
          <form
            id="project-settings"
            className="flex min-w-0 flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length >= 2 && slugify(slug)) save.mutate();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-name" className="text-xs text-muted-foreground">
                Nome do projeto
              </label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Endereço</span>
              <SlugInput prefix="/p/" value={slug} onChange={setSlug} />
              {slugChanged ? (
                <p className="text-xs leading-relaxed text-amber-500">
                  Os links das páginas passam a usar o endereço novo, e os links antigos deixam de funcionar.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Página inicial</span>
              <Select value={home} onValueChange={setHome}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO}>Automática</SelectItem>
                  {d.publishedPages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (/{p.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Abre em /p/{slugify(slug) || d.slug}. Automática: a página "home" ou "inicio", ou a primeira publicada.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Página de erro (404)</span>
              <Select value={notFound} onValueChange={setNotFound}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO}>Padrão</SelectItem>
                  {d.publishedPages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (/{p.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Aparece quando alguém abre um endereço que não existe. Ela fica fora do sitemap.
              </p>
            </div>
            {d.isOwner ? (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Excluir projeto</span>
                  <span className="text-xs text-muted-foreground">
                    Apaga páginas, leads, visitas e arquivos. Não dá para desfazer.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Excluir projeto?",
                      description: (
                        <>
                          <strong>{d.name}</strong> e tudo o que há nele (páginas, leads, visitas e arquivos) serão
                          apagados para sempre.
                        </>
                      ),
                      confirmText: "Excluir projeto",
                      destructive: true,
                      requireText: d.name,
                    });
                    if (ok) remove.mutate();
                  }}
                >
                  <Trash2 className="size-4" /> Excluir
                </Button>
              </div>
            ) : null}
          </form>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="project-settings"
            disabled={!d || save.isPending || name.trim().length < 2 || !slugify(slug)}
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
