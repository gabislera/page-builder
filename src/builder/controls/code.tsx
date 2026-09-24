import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import { Maximize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { getPath } from "../core/path.ts";
import { Field } from "./field.tsx";
import { useNodeProps } from "./use-field.ts";

const LANGUAGES = { html: [html()], css: [css()] };
const DEBOUNCE_MS = 600;

/**
 * Editor de código (HTML, CSS e JS) com tema escuro. Propaga as mudanças só
 * depois de parar de digitar, para não criar um passo de undo por tecla.
 * Tem um modo "tela cheia" num diálogo.
 */
export function CodeField({
  path,
  label,
  hint,
  language = "html",
}: {
  path: string;
  label: string;
  hint?: string;
  language?: keyof typeof LANGUAGES;
}) {
  const { props, set } = useNodeProps<Record<string, unknown>>();
  const value = String(getPath(props, path) ?? "");
  const extensions = LANGUAGES[language];
  const [draft, setDraft] = useState(value);
  const [fullscreen, setFullscreen] = useState(false);
  // último valor enviado, para distinguir mudanças externas (undo/redo)
  const sent = useRef(value);
  const pending = useRef<string | null>(null);

  const commit = useCallback(
    (next: string) => {
      pending.current = null;
      if (next === sent.current) return;
      sent.current = next;
      set(path, next);
    },
    [path, set],
  );

  // valor mudou por fora: sincroniza o rascunho
  useEffect(() => {
    if (value !== sent.current) {
      sent.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === sent.current) return;
    pending.current = draft;
    const t = setTimeout(() => commit(draft), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft, commit]);

  // não perde a última digitação se o painel fechar antes do debounce
  const commitRef = useRef(commit);
  commitRef.current = commit;
  useEffect(
    () => () => {
      if (pending.current !== null) commitRef.current(pending.current);
    },
    [],
  );

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-1.5">
        <div className="overflow-hidden rounded-md border border-input text-xs">
          <CodeMirror
            value={draft}
            onChange={setDraft}
            extensions={extensions}
            theme="dark"
            height="260px"
            basicSetup={{ foldGutter: false, highlightActiveLine: false }}
          />
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-input text-[11px] hover:bg-accent"
        >
          <Maximize2 className="size-3.5" /> Editar em tela cheia
        </button>
      </div>
      <Dialog
        open={fullscreen}
        onOpenChange={(open) => {
          setFullscreen(open);
          if (!open && pending.current !== null) commit(pending.current);
        }}
      >
        <DialogContent className="flex h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-3 sm:max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>As alterações são aplicadas automaticamente ao parar de digitar.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-input text-sm">
            <CodeMirror
              value={draft}
              onChange={setDraft}
              extensions={extensions}
              theme="dark"
              height="100%"
              style={{ height: "100%" }}
              autoFocus
            />
          </div>
        </DialogContent>
      </Dialog>
    </Field>
  );
}
