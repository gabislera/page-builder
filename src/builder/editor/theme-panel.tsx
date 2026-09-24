import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { ColorInput } from "../controls/color.tsx";
import { Field, Group } from "../controls/field.tsx";
import { SegmentedInput, SelectInput } from "../controls/inputs.tsx";
import { MediaInput } from "../controls/media.tsx";
import { FONT_OPTIONS, fontStack, googleFontsHref } from "../core/style-engine.ts";
import type { CookieBanner, SiteTheme, ThemeColor } from "../core/theme.ts";
import { useEditorContext } from "./context.tsx";
import { useSiteStore } from "./site-store.ts";

/* ------------------------------------------------------------------ */
/* Autosave of site settings                                           */
/* ------------------------------------------------------------------ */

/** Saves theme and identity shortly after each change. */
export function SiteSettingsController() {
  const { services } = useEditorContext();
  const dirty = useSiteStore((s) => s.dirty);
  const theme = useSiteStore((s) => s.settings.theme);
  const identity = useSiteStore((s) => s.settings.identity);
  const cookieBanner = useSiteStore((s) => s.settings.cookieBanner);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(async () => {
      try {
        const saved = await services.updateSiteSettings({
          theme,
          identity,
          cookieBanner,
        });
        useSiteStore.getState().markSaved(saved);
      } catch (e) {
        toast.error(`Não foi possível salvar o tema: ${e instanceof Error ? e.message : e}`);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [dirty, theme, identity, cookieBanner, services]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export function ThemePanel() {
  return (
    <div className="flex flex-col">
      <p className="px-4 pt-3 text-[11px] text-muted-foreground">
        Identidade, cores, fontes e aviso de cookies do site. Valem para todas as páginas do projeto.
      </p>
      <RepublishBanner />
      <Group title="Identidade">
        <IdentityFields />
      </Group>
      <Group title="Cores globais">
        <ColorsEditor />
      </Group>
      <Group title="Fontes globais">
        <FontsEditor />
      </Group>
      <Group title="Aviso de cookies (LGPD)" defaultOpen={false}>
        <CookieBannerFields />
      </Group>
    </div>
  );
}

function RepublishBanner() {
  const { services } = useEditorContext();
  const needs = useSiteStore((s) => s.needsRepublish);
  const dirty = useSiteStore((s) => s.dirty);
  const [busy, setBusy] = useState(false);
  if (!needs) return null;
  return (
    <div className="mx-4 mt-3 flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[11px]">
      <span>As mudanças de tema já aparecem no editor. Para levar às páginas publicadas, republique.</span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={busy || dirty}
        onClick={async () => {
          setBusy(true);
          try {
            const { count } = await services.republishSite();
            useSiteStore.getState().markRepublished();
            toast.success(
              count
                ? `${count} ${count === 1 ? "página republicada" : "páginas republicadas"}`
                : "Nenhuma página publicada ainda",
            );
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Falha ao republicar");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
        Republicar páginas publicadas
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cookie notice                                                       */
/* ------------------------------------------------------------------ */

function CookieBannerFields() {
  const cb = useSiteStore((s) => s.settings.cookieBanner);
  const setCookieBanner = useSiteStore((s) => s.setCookieBanner);
  const set = (patch: Partial<CookieBanner>) => setCookieBanner({ ...cb, ...patch });
  const text = (key: keyof CookieBanner, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <Input className="h-8 text-xs" value={String(cb[key] ?? "")} onChange={(e) => set({ [key]: e.target.value })} />
    </Field>
  );
  return (
    <>
      <Field label="Mostrar aviso de cookies" inline>
        <Switch checked={cb.enabled} onCheckedChange={(enabled) => set({ enabled })} />
      </Field>
      {cb.enabled ? (
        <>
          <Field
            label="Pixels e scripts"
            hint={
              cb.mode === "block"
                ? "Pixels (Meta, Google, TikTok) e scripts das páginas só carregam depois que o visitante aceita. É o recomendado pela LGPD."
                : "O aviso só informa: pixels e scripts carregam normalmente."
            }
          >
            <SegmentedInput
              value={cb.mode}
              onChange={(mode) => set({ mode })}
              options={[
                { value: "block", label: "Só após aceitar" },
                { value: "notice", label: "Apenas avisar" },
              ]}
            />
          </Field>
          <Field label="Texto">
            <Textarea className="min-h-20 text-xs" value={cb.text} onChange={(e) => set({ text: e.target.value })} />
          </Field>
          {text("acceptText", "Botão de aceitar")}
          {cb.mode === "block" ? text("rejectText", "Botão de recusar") : null}
          {text("policyText", "Texto do link da política")}
          {text(
            "policyUrl",
            "Link da política de privacidade",
            "Endereço da página com a política. Vazio: o link não aparece.",
          )}
          <Field label="Posição">
            <SegmentedInput
              value={cb.position}
              onChange={(position) => set({ position })}
              options={[
                { value: "bottom-left", label: "Canto esq." },
                { value: "bottom", label: "Faixa" },
                { value: "bottom-right", label: "Canto dir." },
              ]}
            />
          </Field>
          <Field label="Aparência">
            <SegmentedInput
              value={cb.appearance}
              onChange={(appearance) => set({ appearance })}
              options={[
                { value: "light", label: "Claro" },
                { value: "dark", label: "Escuro" },
              ]}
            />
          </Field>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Para o visitante mudar a escolha depois, crie um link para{" "}
            <code className="rounded bg-muted px-1">#cookies</code> (por exemplo, no rodapé). O aviso aparece na página
            publicada e na prévia.
          </p>
        </>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

function IdentityFields() {
  const identity = useSiteStore((s) => s.settings.identity);
  const setIdentity = useSiteStore((s) => s.setIdentity);
  return (
    <>
      <Field label="Nome do site" hint="Usado no Logo quando não há imagem e no título das páginas.">
        <Input
          className="h-8 text-xs"
          value={identity.name}
          onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
        />
      </Field>
      <Field label="Logo">
        <MediaInput
          accept="image"
          value={identity.logoUrl}
          onChange={(logoUrl) => setIdentity({ ...identity, logoUrl })}
        />
      </Field>
      <Field label="Logo para fundo escuro (opcional)">
        <MediaInput
          accept="image"
          value={identity.logoLightUrl}
          onChange={(logoLightUrl) => setIdentity({ ...identity, logoLightUrl })}
        />
      </Field>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

function ColorsEditor() {
  const theme = useSiteStore((s) => s.settings.theme);
  const setTheme = useSiteStore((s) => s.setTheme);
  const update = (colors: ThemeColor[]) => setTheme({ ...theme, colors });

  const addColor = () => {
    const used = new Set(theme.colors.map((c) => c.id));
    let n = 1;
    while (used.has(`custom-${n}`)) n++;
    update([...theme.colors, { id: `custom-${n}`, name: `Cor ${n}`, value: "#64748b" }]);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-muted-foreground">
        Elementos que usam uma cor do site mudam juntos quando ela muda.
      </p>
      {theme.colors.map((c) => (
        <ColorRow
          key={c.id}
          color={c}
          onChange={(next) => update(theme.colors.map((x) => (x.id === c.id ? next : x)))}
          onRemove={c.system ? undefined : () => update(theme.colors.filter((x) => x.id !== c.id))}
        />
      ))}
      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addColor}>
        <Plus className="size-3.5" /> Adicionar cor
      </Button>
    </div>
  );
}

function ColorRow({
  color,
  onChange,
  onRemove,
}: {
  color: ThemeColor;
  onChange: (c: ThemeColor) => void;
  onRemove?: () => void;
}) {
  // name edited locally and committed on blur
  const [name, setName] = useState(color.name);
  const last = useRef(color.name);
  if (last.current !== color.name) {
    last.current = color.name;
    setName(color.name);
  }
  return (
    <div className="flex items-center gap-1.5">
      <ColorInput
        className="w-[92px] shrink-0"
        allowGlobal={false}
        value={color.value}
        onChange={(value) => onChange({ ...color, value })}
      />
      <Input
        className="h-8 min-w-0 flex-1 text-xs"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && onChange({ ...color, name: name.trim() })}
      />
      {onRemove ? (
        <button
          type="button"
          title="Remover cor"
          onClick={onRemove}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

const FONT_SELECT = FONT_OPTIONS.filter((f) => f !== "inherit").map((f) => ({
  value: f,
  label: f,
}));

function FontsEditor() {
  const theme = useSiteStore((s) => s.settings.theme);
  const setTheme = useSiteStore((s) => s.setTheme);
  const setFont = (key: keyof SiteTheme["fonts"], value: string) =>
    setTheme({ ...theme, fonts: { ...theme.fonts, [key]: value } });

  const href = googleFontsHref([theme.fonts.heading, theme.fonts.body]);
  return (
    <>
      {/* load the chosen fonts for the preview below */}
      {href ? <link rel="stylesheet" href={href} precedence="default" /> : null}
      <Field label="Títulos">
        <SelectInput value={theme.fonts.heading} options={FONT_SELECT} onChange={(v) => setFont("heading", v)} />
      </Field>
      <Field label="Texto">
        <SelectInput value={theme.fonts.body} options={FONT_SELECT} onChange={(v) => setFont("body", v)} />
      </Field>
      <div className="rounded-md border border-border bg-white p-3 text-zinc-900">
        <p className="text-lg leading-tight font-bold" style={{ fontFamily: fontStack(theme.fonts.heading) }}>
          Título de exemplo
        </p>
        <p className="mt-1 text-xs text-zinc-600" style={{ fontFamily: fontStack(theme.fonts.body) }}>
          Um parágrafo para você ver como o texto fica com esta fonte.
        </p>
      </div>
    </>
  );
}
