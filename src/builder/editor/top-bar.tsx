import { useEditor } from "@craftjs/core";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  CloudOff,
  CloudUpload,
  ExternalLink,
  Eye,
  Loader2,
  Monitor,
  Redo2,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { confirm } from "#/components/confirm-dialog";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import type { Device } from "../core/responsive.ts";
import { useEditorContext } from "./context.tsx";
import { PreviewDialog } from "./preview-dialog.tsx";
import { useSaveState } from "./save-store.ts";
import { useEditorUI } from "./store.ts";

export function TopBar({ pageName, pagePath }: { pageName: string; pagePath: string }) {
  const { projectId, services } = useEditorContext();
  const device = useEditorUI((s) => s.device);
  const setDevice = useEditorUI((s) => s.setDevice);
  const zoom = useEditorUI((s) => s.zoom);
  const setZoom = useEditorUI((s) => s.setZoom);
  const { canUndo, canRedo, actions } = useEditor((_, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const publishedAt = useSaveState((s) => s.publishedAt);

  const unpublish = async () => {
    const ok = await confirm({
      title: "Despublicar página?",
      description:
        "A página sai do ar: o endereço deixa de abrir e os formulários param de receber leads. O conteúdo continua salvo e pode ser publicado de novo.",
      confirmText: "Despublicar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await services.unpublishPage();
      useSaveState.getState().set({ publishedAt: null });
      toast.success("Página despublicada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao despublicar");
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      // garante que o que está na tela foi salvo antes de publicar
      useSaveState.getState().requestFlush();
      await waitForSaved();
      const res = await services.publishPage(useSaveState.getState().affectedPageIds);
      useSaveState.getState().set({ publishedAt: res.publishedAt, affectedPageIds: [] });
      toast.success("Página publicada!", {
        action: {
          label: "Abrir",
          onClick: () => window.open(res.url, "_blank"),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-editor-bg px-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to="/projects/$projectId" params={{ projectId }}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Voltar para as páginas</TooltipContent>
      </Tooltip>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{pageName}</span>
        <span className="truncate text-[11px] text-muted-foreground">{pagePath}</span>
      </div>

      <div className="mx-auto flex items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={device}
          onValueChange={(v) => v && setDevice(v as Device)}
        >
          <ToggleGroupItem value="desktop" aria-label="Desktop" title="Desktop">
            <Monitor className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="tablet" aria-label="Tablet" title="Tablet">
            <Tablet className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" aria-label="Celular" title="Celular">
            <Smartphone className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-20 text-xs">
              {zoom === "fit" ? "Ajustar" : `${Math.round(zoom * 100)}%`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setZoom("fit")}>Ajustar à tela</DropdownMenuItem>
            {[0.5, 0.75, 1].map((z) => (
              <DropdownMenuItem key={z} onClick={() => setZoom(z)}>
                {z * 100}%
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={!canUndo}
          onClick={() => actions.history.undo()}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={!canRedo}
          onClick={() => actions.history.redo()}
          title="Refazer (Ctrl+Shift+Z)"
        >
          <Redo2 className="size-4" />
        </Button>
        <SaveIndicator />
        <Button variant="outline" size="sm" className="h-8" onClick={() => setPreviewOpen(true)}>
          <Eye className="size-4" /> Prévia
        </Button>
        {publishedAt ? (
          <Button asChild variant="ghost" size="icon" className="size-8" title="Abrir página publicada">
            <a href={pagePath} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        ) : null}
        <div className="flex">
          <Button
            size="sm"
            className={publishedAt ? "h-8 rounded-r-none" : "h-8"}
            onClick={publish}
            disabled={publishing}
            title={publishedAt ? "Publicar as alterações" : "Colocar a página no ar"}
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
            Publicar
          </Button>
          {publishedAt ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 rounded-l-none border-l border-primary-foreground/20 px-1.5"
                  aria-label="Mais opções de publicação"
                >
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={unpublish}>
                  <CloudOff className="size-4" /> Despublicar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </header>
  );
}

function SaveIndicator() {
  const status = useSaveState((s) => s.status);
  const requestFlush = useSaveState((s) => s.requestFlush);
  if (status === "conflict") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="destructive" size="sm" className="h-8 text-xs">
            <AlertTriangle className="size-3.5" /> Conflito
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-w-72">
          <p className="p-2 text-xs text-muted-foreground">
            Esta página foi salva em outra aba ou por outra pessoa depois que você abriu.
          </p>
          <DropdownMenuItem onClick={() => window.location.reload()}>Recarregar a versão mais nova</DropdownMenuItem>
          <DropdownMenuItem onClick={requestFlush}>Sobrescrever com a minha versão</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  const label = {
    saved: "Salvo",
    dirty: "Alterações não salvas",
    saving: "Salvando...",
    error: "Erro ao salvar",
    conflict: "",
  }[status];
  return (
    <button
      type="button"
      onClick={requestFlush}
      title="Salvar agora (Ctrl+S)"
      className="flex h-8 items-center gap-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {status === "saving" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : status === "saved" ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : status === "error" ? (
        <AlertTriangle className="size-3.5 text-destructive" />
      ) : (
        <span className="size-2 rounded-full bg-amber-500" />
      )}
      {label}
    </button>
  );
}

function waitForSaved(timeoutMs = 15000) {
  return new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      const { status, error } = useSaveState.getState();
      if (status === "saved") return resolve();
      if (status === "error" || status === "conflict") return reject(new Error(error ?? "Salve antes de publicar"));
      if (Date.now() - started > timeoutMs) return reject(new Error("Tempo esgotado ao salvar"));
      setTimeout(check, 150);
    };
    setTimeout(check, 50);
  });
}
