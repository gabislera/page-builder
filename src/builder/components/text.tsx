import { EditorContent, useEditor } from "@tiptap/react";
import { Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Group } from "../controls/field.tsx";
import { BoxFields, ShadowFields, TypographyFields } from "../controls/groups.tsx";
import { RichTextField, richExtensions, useInlineRich } from "../controls/rich-text.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { defaultBox, defaultTextShadow, defaultTypography } from "../core/defaults.ts";
import { fillTokens, mergeRefs } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { responsive } from "../core/responsive.ts";
import { applyBox, applyTypography, createSheet, GOOGLE_FONTS, textShadowToCss } from "../core/style-engine.ts";
import type { Box, TextShadow, Typography } from "../core/style-types.ts";
import { C } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type TextProps = {
  /** HTML gerado pelo editor de texto rico. */
  html: string;
  typography: Typography;
  linkColor: string;
  textShadow: TextShadow;
  box: Box;
};

function TextView({ id, props, rootRef, onPropChange }: NodeViewProps<TextProps>) {
  const isEditor = useIsEditor();
  const [editing, setEditing] = useState(false);
  const className = nodeClassName(id, "pb-text pb-rich", props.box);

  if (isEditor && editing && onPropChange) {
    return (
      <InlineRichText
        id={id}
        className={className}
        rootRef={rootRef}
        value={props.html}
        onCommit={(html) => {
          setEditing(false);
          if (html !== props.html) onPropChange("html", html);
        }}
      />
    );
  }
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={className}
      data-pb-node={id}
      onDoubleClick={isEditor ? () => setEditing(true) : undefined}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML produzido pelo Tiptap (schema restrito)
      dangerouslySetInnerHTML={{ __html: fillTokens(props.html) }}
    />
  );
}

function InlineRichText({
  id,
  className,
  rootRef,
  value,
  onCommit,
}: {
  id: string;
  className: string;
  rootRef?: React.Ref<HTMLElement>;
  value: string;
  onCommit: (html: string) => void;
}) {
  const setActive = useInlineRich((s) => s.set);
  const wrapper = useRef<HTMLDivElement | null>(null);
  const editor = useEditor({
    extensions: richExtensions,
    content: value,
    immediatelyRender: true,
    autofocus: "end",
  });

  useEffect(() => {
    if (!editor) return;
    setActive(id, editor);
    const el = wrapper.current;
    el?.setAttribute("draggable", "false");
    el?.classList.add("pb-editing");

    // conclui ao clicar fora do texto dentro do canvas
    const doc = el?.ownerDocument;
    const onPointerDown = (e: PointerEvent) => {
      if (el && !el.contains(e.target as Node)) onCommit(editor.getHTML());
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCommit(editor.getHTML());
    };
    doc?.addEventListener("pointerdown", onPointerDown, true);
    doc?.addEventListener("keydown", onKey, true);
    return () => {
      doc?.removeEventListener("pointerdown", onPointerDown, true);
      doc?.removeEventListener("keydown", onKey, true);
      setActive(null, null);
    };
  }, [editor, id, onCommit, setActive]);

  return (
    <div
      ref={mergeRefs(rootRef, wrapper) as React.Ref<HTMLDivElement>}
      className={className}
      data-pb-node={id}
      // evita que atalhos do editor (Delete, Ctrl+Z) atuem nos nós enquanto digita
      onKeyDown={(e) => e.stopPropagation()}
    >
      <EditorContent editor={editor} />
    </div>
  );
}

function TextSettings() {
  return (
    <SettingsTabs
      content={
        <Group title="Texto">
          <RichTextField path="html" label="Conteúdo" />
        </Group>
      }
      style={
        <>
          <Group title="Tipografia">
            <TypographyFields base="typography" />
          </Group>
          <Group title="Sombra" defaultOpen={false}>
            <ShadowFields base="textShadow" text />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Text: ComponentDefinition<TextProps> = {
  type: "Text",
  displayName: "Texto",
  category: "basic",
  icon: Type,
  inToolbox: true,
  defaults: {
    html: "<p>Escreva aqui um texto que explique sua oferta. Dê dois cliques para editar e use a barra de formatação no painel ao lado.</p>",
    typography: defaultTypography({
      fontSize: responsive("18px", undefined, "16px"),
      lineHeight: responsive("1.6"),
      color: C.textMuted,
    }),
    linkColor: C.primary,
    textShadow: defaultTextShadow(),
    box: defaultBox(),
  },
  View: TextView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    applyTypography(root, p.typography);
    root.set("text-shadow", textShadowToCss(p.textShadow)).set("overflow-wrap", "break-word");
    sheet.rule(" a").set("color", p.linkColor);
    sheet.rule(" p + p").set("margin-top", "0.75em");
    sheet.rule(" .ProseMirror").set("outline", "none");
    applyBox(sheet, p.box);
    return sheet.toString();
  },
  Settings: TextSettings,
  fonts: (p) => [p.typography.fontFamily, ...Object.keys(GOOGLE_FONTS).filter((f) => p.html.includes(f))],
};
