import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, FilePlus2, Loader2, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SlugInput } from "#/components/slug-input";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { slugify } from "#/lib/slug";
import { cn } from "#/lib/utils";
import { createPage, listPageTemplates, previewPageTemplate } from "#/server/pages";

const BLANK = "blank";
/** Width the preview is rendered at (desktop) before being scaled down. */
const PREVIEW_WIDTH = 1280;

/** New page: pick a template (with a real preview) and give it a name. */
export function NewPageDialog({ projectId, projectSlug }: { projectId: string; projectSlug: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(BLANK);
  const [name, setName] = useState("");
  // slug follows the name until the user edits it
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const rename = (next: string) => {
    setName(next);
    if (!slugTouched) setSlug(slugify(next));
  };
  const templates = useQuery({
    queryKey: ["page-templates"],
    queryFn: () => listPageTemplates(),
    enabled: open,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const create = useMutation({
    mutationFn: () =>
      createPage({
        data: {
          projectId,
          name: name.trim(),
          slug: slugify(slug) || undefined,
          templateId: templateId === BLANK ? undefined : templateId,
        },
      }),
    onSuccess: (p) => navigate({ to: "/editor/$pageId", params: { pageId: p.id } }),
    onError: (e) => toast.error(e.message),
  });

  const choose = (id: string, label: string) => {
    setTemplateId(id);
    // suggest the template name if the user has not typed one yet
    if (!name.trim() || name === suggested.current) rename(label);
    suggested.current = label;
  };
  const suggested = useRef("");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setTemplateId(BLANK);
          setName("");
          setSlug("");
          setSlugTouched(false);
          suggested.current = "";
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 className="size-4" /> Nova página
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] flex-col gap-5 sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Nova página</DialogTitle>
          <DialogDescription>
            Comece em branco ou a partir de um modelo pronto. Tudo pode ser editado depois, e o modelo já usa as cores e
            fontes do seu site.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-1 grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-1 py-1 sm:grid-cols-2 lg:grid-cols-4">
          <TemplateCard
            selected={templateId === BLANK}
            onSelect={() => choose(BLANK, "")}
            name="Em branco"
            description="Uma seção inicial para você montar do seu jeito."
          >
            <div className="flex size-full items-center justify-center">
              <Plus className="size-8 text-muted-foreground" />
            </div>
          </TemplateCard>
          {templates.isLoading
            ? [0, 1, 2].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />)
            : null}
          {templates.data?.map((t) => (
            <TemplateCard
              key={t.id}
              selected={templateId === t.id}
              onSelect={() => choose(t.id, t.name)}
              name={t.name}
              description={t.description}
            >
              <TemplatePreview projectId={projectId} templateId={t.id} />
            </TemplateCard>
          ))}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center">
          <form
            className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) create.mutate();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-page-name" className="text-xs text-muted-foreground">
                Nome da página
              </label>
              <Input
                id="new-page-name"
                autoFocus
                placeholder="ex.: Lançamento do curso"
                value={name}
                onChange={(e) => rename(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Endereço</span>
              <SlugInput
                prefix={`/p/${projectSlug}/`}
                value={slug}
                onChange={(v) => {
                  setSlug(v);
                  setSlugTouched(true);
                }}
              />
            </div>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
              Criar página
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  name,
  description,
  selected,
  onSelect,
  children,
}: {
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/40",
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden border-b border-border bg-muted/30">
        {children}
        {selected ? (
          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="size-3.5" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      </div>
    </button>
  );
}

/** Script injected into the preview: scrolls the page when the card asks. */
const PREVIEW_SCRIPT = `<style>html{scrollbar-width:none}::-webkit-scrollbar{display:none}</style><script>
addEventListener("message",function(e){
  var d=e.data;if(!d||!d.pbScroll)return;
  var el=document.documentElement,to=d.pbScroll==="down"?el.scrollHeight-innerHeight:0,from=scrollY;
  var dur=d.pbScroll==="down"?Math.min(10000,Math.max(1500,Math.abs(to-from)*1.4)):500,t0=null;
  cancelAnimationFrame(window.__pbA);
  function step(t){if(t0===null)t0=t;var p=Math.min(1,(t-t0)/dur);var k=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    scrollTo(0,from+(to-from)*k);if(p<1)window.__pbA=requestAnimationFrame(step);}
  window.__pbA=requestAnimationFrame(step);
});
</script>`;

/**
 * Real template page, rendered at 1280px wide and scaled to fit the card.
 * On hover, the page slowly scrolls to the bottom.
 */
function TemplatePreview({ projectId, templateId }: { projectId: string; templateId: string }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ scale: 0.2, height: 1600 });
  const html = useQuery({
    queryKey: ["page-template-preview", projectId, templateId],
    queryFn: () => previewPageTemplate({ data: { projectId, templateId } }),
    staleTime: 60_000,
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const scale = el.clientWidth / PREVIEW_WIDTH;
      setSize({ scale, height: el.clientHeight / scale });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the card (button) is the "group": scroll the preview while hovered
  useEffect(() => {
    const card = box.current?.closest("button");
    if (!card) return;
    const send = (dir: "down" | "up") => frame.current?.contentWindow?.postMessage({ pbScroll: dir }, "*");
    const enter = () => send("down");
    const leave = () => send("up");
    card.addEventListener("mouseenter", enter);
    card.addEventListener("mouseleave", leave);
    return () => {
      card.removeEventListener("mouseenter", enter);
      card.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div ref={box} className="absolute inset-0">
      {html.data ? (
        <iframe
          ref={frame}
          title="Prévia do modelo"
          srcDoc={html.data + PREVIEW_SCRIPT}
          // scripts only (carousel, counters, scroll); no access to the app
          sandbox="allow-scripts"
          tabIndex={-1}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{
            width: PREVIEW_WIDTH,
            height: size.height,
            transform: `scale(${size.scale})`,
          }}
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
