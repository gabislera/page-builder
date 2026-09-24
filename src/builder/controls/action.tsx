import { useEditor } from "@craftjs/core";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import type { Action } from "../core/style-types.ts";
import { ROOT_ID } from "../core/tree.ts";
import { useEditorContext } from "../editor/context.tsx";
import { Field } from "./field.tsx";
import { DebouncedInput, type Option, SelectInput } from "./inputs.tsx";
import { useField } from "./use-field.ts";

const ACTION_TYPES: Option<Action["type"]>[] = [
  { value: "none", label: "Nenhuma" },
  { value: "url", label: "Abrir link" },
  { value: "section", label: "Rolar até seção" },
  { value: "page", label: "Ir para outra página" },
  { value: "modal", label: "Abrir modal" },
  { value: "whatsapp", label: "Abrir WhatsApp" },
];

const EMPTY: Record<Action["type"], Action> = {
  none: { type: "none" },
  url: { type: "url", url: "", newTab: false },
  section: { type: "section", sectionId: "" },
  page: { type: "page", pageId: "", newTab: false },
  modal: { type: "modal", modalId: "" },
  whatsapp: { type: "whatsapp", phone: "", message: "" },
};

export function ActionField({ path, label = "Ao clicar" }: { path: string; label?: string }) {
  const f = useField<Action>(path);
  const action = f.value ?? EMPTY.none;
  return (
    <div className="flex flex-col gap-3">
      <Field label={label}>
        <SelectInput value={action.type} options={ACTION_TYPES} onChange={(t) => f.set(EMPTY[t])} />
      </Field>
      <ActionDetails action={action} onChange={(a) => f.set(a)} />
    </div>
  );
}

export function ActionDetails({ action, onChange }: { action: Action; onChange: (action: Action) => void }) {
  switch (action.type) {
    case "url":
      return (
        <>
          <Field label="URL">
            <DebouncedInput
              value={action.url}
              placeholder="https://"
              onChange={(url) => onChange({ ...action, url })}
            />
          </Field>
          <NewTab checked={action.newTab} onChange={(newTab) => onChange({ ...action, newTab })} />
        </>
      );
    case "section":
      return <SectionPicker value={action.sectionId} onChange={(sectionId) => onChange({ ...action, sectionId })} />;
    case "page":
      return (
        <>
          <PagePicker value={action.pageId} onChange={(pageId) => onChange({ ...action, pageId })} />
          <NewTab checked={action.newTab} onChange={(newTab) => onChange({ ...action, newTab })} />
        </>
      );
    case "modal":
      return <ModalPicker value={action.modalId} onChange={(modalId) => onChange({ ...action, modalId })} />;
    case "whatsapp":
      return (
        <>
          <Field label="Número com DDI e DDD" hint="Ex.: 5511999998888">
            <DebouncedInput value={action.phone} onChange={(phone) => onChange({ ...action, phone })} />
          </Field>
          <Field label="Mensagem inicial">
            <Textarea
              rows={2}
              className="min-h-0 text-xs"
              value={action.message}
              onChange={(e) => onChange({ ...action, message: e.target.value })}
            />
          </Field>
        </>
      );
    default:
      return null;
  }
}

function NewTab({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Field label="Abrir em nova aba" inline>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Field>
  );
}

function SectionPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { sections } = useEditor((state) => ({
    sections: (state.nodes[ROOT_ID]?.data.nodes ?? []).map((id) => {
      const node = state.nodes[id];
      return {
        value: id,
        label: (node?.data.custom?.displayName as string) || node?.data.displayName || id,
      };
    }),
  }));
  return (
    <Field label="Seção">
      <SelectInput value={value || undefined} onChange={onChange} options={sections} placeholder="Escolha a seção" />
    </Field>
  );
}

function ModalPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { modals } = useEditor((state) => ({
    modals: Object.values(state.nodes)
      .filter((n) => n.data.name === "Modal")
      .map((n) => ({
        value: n.id,
        label: (n.data.custom?.displayName as string) || `Modal ${n.id.slice(0, 4)}`,
      })),
  }));
  if (modals.length === 0) {
    return <p className="text-[11px] text-muted-foreground">Adicione um elemento Modal na página primeiro.</p>;
  }
  return (
    <Field label="Modal">
      <SelectInput value={value || undefined} onChange={onChange} options={modals} placeholder="Escolha o modal" />
    </Field>
  );
}

function PagePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { projectId, pageId, services } = useEditorContext();
  const pages = useQuery({
    queryKey: ["pages", projectId],
    queryFn: services.listPages,
  });
  const options = (pages.data ?? [])
    .filter((p) => p.id !== pageId)
    .map((p) => ({ value: p.id, label: `${p.name} (/${p.slug})` }));
  return (
    <Field label="Página">
      <SelectInput
        value={value || undefined}
        onChange={onChange}
        options={options}
        placeholder={pages.isLoading ? "Carregando..." : "Escolha a página"}
      />
    </Field>
  );
}
