import { useEditor } from "@craftjs/core";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { splitPage } from "../core/tree.ts";
import { useEditorContext } from "./context.tsx";
import { useSaveState } from "./save-store.ts";

const DEBOUNCE_MS = 2000;
const draftKey = (pageId: string) => `pb-draft:${pageId}`;

type Draft = { version: number; json: string; at: string };

export function readDraft(pageId: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(pageId));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(pageId: string) {
  try {
    localStorage.removeItem(draftKey(pageId));
  } catch {
    // armazenamento indisponível
  }
}

/**
 * Salva sozinho alguns segundos depois da última alteração. Guarda um
 * rascunho local a cada mudança para não perder trabalho se a aba fechar.
 */
export function AutosaveController() {
  const { pageId, services } = useEditorContext();
  const { query } = useEditor();
  // muda a cada alteração nos nós; vem do onNodesChange do <Editor>
  const changeTick = useSaveState((s) => s.changeTick);
  const savedJson = useRef<string | null>(null);
  const saving = useRef(false);
  const pending = useRef(false);
  const flushRequest = useSaveState((s) => s.flushRequest);

  const save = useCallback(
    async (force = false) => {
      const json = query.serialize();
      if (json === savedJson.current) {
        useSaveState.getState().set({ status: "saved" });
        return;
      }
      if (saving.current) {
        pending.current = true;
        return;
      }
      saving.current = true;
      const { version } = useSaveState.getState();
      useSaveState.getState().set({ status: "saving", error: null });
      try {
        const { root, sections } = splitPage(query.getSerializedNodes());
        const res = await services.savePage({ version, root, sections, force });
        savedJson.current = json;
        clearDraft(pageId);
        const prev = useSaveState.getState().affectedPageIds;
        useSaveState.getState().set({
          status: query.serialize() === json ? "saved" : "dirty",
          version: res.version,
          lastSavedAt: res.updatedAt,
          affectedPageIds: [...new Set([...prev, ...res.affectedPageIds])],
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message.includes("VERSION_CONFLICT")) {
          useSaveState.getState().set({ status: "conflict", error: message });
        } else {
          useSaveState.getState().set({ status: "error", error: message });
          toast.error(`Não foi possível salvar: ${message}`);
        }
      } finally {
        saving.current = false;
        if (pending.current) {
          pending.current = false;
          void save();
        }
      }
    },
    [query, services, pageId],
  );

  // alteração nos nós: rascunho local + salvamento com debounce
  // biome-ignore lint/correctness/useExhaustiveDependencies: changeTick é o gatilho da mudança
  useEffect(() => {
    if (!query.getNodes().ROOT) return;
    const json = query.serialize();
    // primeira árvore carregada = estado que veio do servidor
    if (savedJson.current === null) {
      savedJson.current = json;
      return;
    }
    if (json === savedJson.current) return;
    const { status, version } = useSaveState.getState();
    if (status === "conflict") return;
    useSaveState.getState().set({ status: "dirty" });
    try {
      localStorage.setItem(draftKey(pageId), JSON.stringify({ version, json, at: new Date().toISOString() }));
    } catch {
      // cota cheia: segue só com o salvamento no servidor
    }
    const t = setTimeout(() => void save(), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [changeTick, query, save, pageId]);

  // salvar agora (Ctrl+S, antes de publicar, "sobrescrever" no conflito)
  useEffect(() => {
    if (flushRequest === 0) return;
    const force = useSaveState.getState().status === "conflict";
    void save(force);
  }, [flushRequest, save]);

  // avisa antes de fechar com alterações não salvas
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const { status } = useSaveState.getState();
      if (status === "dirty" || status === "saving") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return null;
}
