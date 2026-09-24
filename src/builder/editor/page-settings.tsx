import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SlugInput } from "#/components/slug-input";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import type { PageSeo, PageTracking } from "#/db/schema";
import { slugify } from "#/lib/slug";
import { Field, Group } from "../controls/field.tsx";
import { MediaInput } from "../controls/media.tsx";
import { useEditorContext } from "./context.tsx";

export type PageMeta = {
  name: string;
  slug: string;
  seo: PageSeo;
  tracking: PageTracking;
};

/** SEO, URL, and tracking. Saved separately from content (save button). */
export function PageMetaPanel({ initial, onSaved }: { initial: PageMeta; onSaved: (meta: PageMeta) => void }) {
  const { services, projectSlug } = useEditorContext();
  const [meta, setMeta] = useState(initial);
  const dirty = JSON.stringify(meta) !== JSON.stringify(initial);

  const save = useMutation({
    mutationFn: () => services.updateSettings({ ...meta, slug: slugify(meta.slug) }),
    onSuccess: (res) => {
      const next = { ...meta, ...res } as PageMeta;
      setMeta(next);
      onSaved(next);
      toast.success("Configurações salvas");
    },
    onError: (e) => toast.error(e.message),
  });

  const seo = (patch: Partial<PageSeo>) => setMeta((m) => ({ ...m, seo: { ...m.seo, ...patch } }));
  const tracking = (patch: Partial<PageTracking>) => setMeta((m) => ({ ...m, tracking: { ...m.tracking, ...patch } }));

  return (
    <div className="flex flex-col">
      <Group title="Página">
        <Field label="Nome interno">
          <Input
            className="h-8 text-xs"
            value={meta.name}
            onChange={(e) => setMeta({ ...meta, name: e.target.value })}
          />
        </Field>
        <Field
          label="Endereço da página"
          hint="Letras minúsculas, números e hífen. Links antigos para o endereço anterior deixam de funcionar."
        >
          <SlugInput
            size="sm"
            prefix={`/p/${projectSlug}/`}
            value={meta.slug}
            onChange={(slug) => setMeta((m) => ({ ...m, slug }))}
          />
        </Field>
      </Group>
      <Group title="SEO e compartilhamento">
        <Field label="Título da aba / Google" hint={`${(meta.seo.title ?? "").length}/60 caracteres recomendados`}>
          <Input
            className="h-8 text-xs"
            value={meta.seo.title ?? ""}
            onChange={(e) => seo({ title: e.target.value })}
          />
        </Field>
        <Field label="Descrição" hint={`${(meta.seo.description ?? "").length}/160 caracteres recomendados`}>
          <Textarea
            rows={3}
            className="min-h-0 text-xs"
            value={meta.seo.description ?? ""}
            onChange={(e) => seo({ description: e.target.value })}
          />
        </Field>
        <Field label="Favicon">
          <MediaInput accept="image" value={meta.seo.faviconUrl ?? ""} onChange={(v) => seo({ faviconUrl: v })} />
        </Field>
        <Field label="Imagem de compartilhamento (1200×630)">
          <MediaInput accept="image" value={meta.seo.ogImageUrl ?? ""} onChange={(v) => seo({ ogImageUrl: v })} />
        </Field>
        <Field label="Esconder dos buscadores" inline>
          <Switch checked={Boolean(meta.seo.noIndex)} onCheckedChange={(v) => seo({ noIndex: v })} />
        </Field>
      </Group>
      <Group title="Rastreamento" defaultOpen={false}>
        <Field label="Pixel do Facebook (ID)">
          <Input
            className="h-8 font-mono text-xs"
            value={meta.tracking.facebookPixelId ?? ""}
            onChange={(e) => tracking({ facebookPixelId: e.target.value.trim() })}
          />
        </Field>
        <Field label="Google Analytics / Ads (G-... ou AW-...)">
          <Input
            className="h-8 font-mono text-xs"
            value={meta.tracking.googleTagId ?? ""}
            onChange={(e) => tracking({ googleTagId: e.target.value.trim() })}
          />
        </Field>
        <Field label="Pixel do TikTok (ID)">
          <Input
            className="h-8 font-mono text-xs"
            value={meta.tracking.tiktokPixelId ?? ""}
            onChange={(e) => tracking({ tiktokPixelId: e.target.value.trim() })}
          />
        </Field>
        <Field label="Scripts no <head>">
          <Textarea
            rows={4}
            className="min-h-0 font-mono text-[11px]"
            value={meta.tracking.headScripts ?? ""}
            onChange={(e) => tracking({ headScripts: e.target.value })}
          />
        </Field>
        <Field label="Scripts no fim do <body>">
          <Textarea
            rows={4}
            className="min-h-0 font-mono text-[11px]"
            value={meta.tracking.bodyScripts ?? ""}
            onChange={(e) => tracking({ bodyScripts: e.target.value })}
          />
        </Field>
      </Group>
      <div className="sticky bottom-0 border-t border-border bg-editor-panel p-4">
        <Button className="w-full" size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvar configurações
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Mudanças de SEO e pixels entram no ar na próxima publicação.
        </p>
      </div>
    </div>
  );
}
