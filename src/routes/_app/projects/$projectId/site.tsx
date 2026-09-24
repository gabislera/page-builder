import type { SerializedNodes } from "@craftjs/core";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BASE_CSS } from "#/builder/core/base-css";
import { googleFontsHref } from "#/builder/core/style-engine";
import { themeCss, themeFonts } from "#/builder/core/theme";
import { EditorContextProvider, type EditorServices } from "#/builder/editor/context";
import { useSiteStore } from "#/builder/editor/site-store";
import { SiteSettingsController, ThemePanel } from "#/builder/editor/theme-panel";
import { renderBody } from "#/builder/renderer/render-page";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { projectServices } from "#/lib/project-services";
import { getEditorPage, listPages } from "#/server/pages";
import { getSiteSettings } from "#/server/site";

/** Site-wide settings (identity, colors, fonts, cookies) with a live preview. */
export const Route = createFileRoute("/_app/projects/$projectId/site")({
  component: SitePage,
});

const onlyInEditor = () => Promise.reject(new Error("Disponível só no editor de páginas"));

function SitePage() {
  const { projectId } = Route.useParams();
  const settings = useQuery({
    queryKey: ["site-settings", projectId],
    queryFn: () => getSiteSettings({ data: { projectId } }),
    staleTime: 0,
  });
  const [ready, setReady] = useState(false);
  // the theme panel edits the shared site store; load this project's settings into it
  useEffect(() => {
    if (!settings.data) return;
    useSiteStore.getState().init(settings.data, { header: null, footer: null });
    setReady(true);
  }, [settings.data]);

  const services = useMemo(
    () =>
      ({
        ...projectServices(projectId),
        listPages: () => listPages({ data: { projectId } }),
        listGlobalSections: onlyInEditor,
        savePage: onlyInEditor,
        publishPage: onlyInEditor,
        unpublishPage: onlyInEditor,
        listSavedSections: onlyInEditor,
        saveSectionAsTemplate: onlyInEditor,
        deleteSavedSection: onlyInEditor,
        updateSettings: onlyInEditor,
        generateSection: onlyInEditor,
      }) satisfies EditorServices,
    [projectId],
  );

  if (!ready) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;

  return (
    <EditorContextProvider value={{ projectId, projectSlug: "", pageId: "", services }}>
      <SiteSettingsController />
      <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-y-auto rounded-xl border border-border bg-card lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          <ThemePanel />
        </aside>
        <SitePreview projectId={projectId} />
      </div>
    </EditorContextProvider>
  );
}

/** Width the preview is rendered at (desktop) before being scaled down. */
const PREVIEW_WIDTH = 1280;

/**
 * A real page of the project with the theme being
 * edited. Theme changes swap only the CSS variables inside the iframe, so
 * the preview updates live without reloading or losing the scroll.
 */
function SitePreview({ projectId }: { projectId: string }) {
  const pages = useQuery({
    queryKey: ["pages", projectId],
    queryFn: () => listPages({ data: { projectId } }),
  });
  const [pageId, setPageId] = useState<string | null>(null);
  const selected = pageId ?? pages.data?.[0]?.id ?? null;

  const page = useQuery({
    queryKey: ["site-preview-page", selected],
    queryFn: () => getEditorPage({ data: { pageId: selected ?? "" } }),
    enabled: Boolean(selected),
  });
  const nodes: SerializedNodes | null = page.data?.nodes ?? null;

  const identity = useSiteStore((s) => s.settings.identity);
  const theme = useSiteStore((s) => s.settings.theme);

  // full render only when the page or the identity (logo, name) changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: identity is read from the store; it is here to trigger the re-render
  const srcDoc = useMemo(() => {
    if (!nodes) return null;
    const { html, css, fonts } = renderBody({
      pageId: selected ?? "",
      nodes,
      pageUrl: () => "#",
      site: useSiteStore.getState().settings,
      homeUrl: "#",
    });
    const href = googleFontsHref(fonts);
    return `<!doctype html><html><head>${href ? `<link rel="stylesheet" href="${href}">` : ""}<style>${BASE_CSS}${css}</style></head><body>${html}</body></html>`;
  }, [nodes, selected, identity]);

  const frame = useRef<HTMLIFrameElement>(null);
  const applyTheme = () => {
    const doc = frame.current?.contentDocument;
    if (!doc?.head) return;
    let style = doc.getElementById("pb-live-theme");
    if (!style) {
      style = doc.createElement("style");
      style.id = "pb-live-theme";
      doc.head.appendChild(style);
    }
    style.textContent = themeCss(theme);
    const href = googleFontsHref(themeFonts(theme));
    let link = doc.getElementById("pb-live-fonts") as HTMLLinkElement | null;
    if (href) {
      if (!link) {
        link = doc.createElement("link");
        link.id = "pb-live-fonts";
        link.rel = "stylesheet";
        doc.head.appendChild(link);
      }
      if (link.href !== href) link.href = href;
    }
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-apply on every theme change
  useEffect(applyTheme, [theme, srcDoc]);

  // rendered at desktop width and scaled to the column
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / PREVIEW_WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const height = 780;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Prévia</span>
          <span className="text-xs text-muted-foreground">
            As mudanças aparecem aqui na hora e valem para todas as páginas.
          </span>
        </div>
        {selected ? (
          <Select value={selected} onValueChange={setPageId}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.data?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      <div
        ref={box}
        className="relative w-full overflow-hidden rounded-xl border border-border bg-white"
        style={{ height }}
      >
        {pages.data?.length === 0 ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-card p-8 text-center">
            <FileText className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">Este projeto ainda não tem nenhuma página</span>
            <span className="max-w-sm text-xs text-muted-foreground">
              Você já pode definir o nome, as cores e as fontes do site. Tudo o que escolher aqui vale para as páginas
              que criar, e elas aparecem nesta prévia.
            </span>
          </div>
        ) : srcDoc ? (
          <iframe
            ref={frame}
            title="Prévia do site"
            srcDoc={srcDoc}
            onLoad={applyTheme}
            className="absolute top-0 left-0 origin-top-left border-0"
            style={{ width: PREVIEW_WIDTH, height: height / scale, transform: `scale(${scale})` }}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
