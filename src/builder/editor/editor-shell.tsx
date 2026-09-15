import type { SerializedNodes } from "@craftjs/core";
import { Editor, Frame, useEditor } from "@craftjs/core";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "#/components/ui/scroll-area";
import { TooltipProvider } from "#/components/ui/tooltip";
import { RenderProvider } from "../core/render-context.tsx";
import { resolver } from "../resolver.ts";
import { AutosaveController, clearDraft, readDraft } from "./autosave.tsx";
import { CanvasFrame } from "./canvas-frame.tsx";
import { EditorContextProvider, type EditorContextValue } from "./context.tsx";
import { LeftPanel } from "./left-panel.tsx";
import type { PageMeta } from "./page-settings.tsx";
import { RenderNode } from "./render-node.tsx";
import { useSaveState } from "./save-store.ts";
import { SectionLibraryDialog } from "./section-library.tsx";
import { SettingsPanel } from "./settings-panel.tsx";
import { KeyboardShortcuts } from "./shortcuts.tsx";
import { TopBar } from "./top-bar.tsx";

export type EditorPageData = {
	id: string;
	projectId: string;
	projectSlug: string;
	name: string;
	slug: string;
	version: number;
	updatedAt: string;
	publishedAt: string | null;
	seo: PageMeta["seo"];
	tracking: PageMeta["tracking"];
};

export function EditorShell({
	page,
	nodes,
	services,
}: {
	page: EditorPageData;
	nodes: SerializedNodes;
	services: EditorContextValue["services"];
}) {
	const [meta, setMeta] = useState<PageMeta>({
		name: page.name,
		slug: page.slug,
		seo: page.seo,
		tracking: page.tracking,
	});
	const [canvasDoc, setCanvasDoc] = useState<Document | null>(null);
	const initialJson = useMemo(() => JSON.stringify(nodes), [nodes]);

	useEffect(() => {
		useSaveState.setState({
			status: "saved",
			version: page.version,
			lastSavedAt: page.updatedAt,
			publishedAt: page.publishedAt,
			affectedPageIds: [],
			error: null,
			flushRequest: 0,
			changeTick: 0,
		});
	}, [page.version, page.updatedAt, page.publishedAt]);

	const context = useMemo<EditorContextValue>(
		() => ({
			projectId: page.projectId,
			projectSlug: page.projectSlug,
			pageId: page.id,
			services,
		}),
		[page.projectId, page.projectSlug, page.id, services],
	);

	return (
		<EditorContextProvider value={context}>
			<RenderProvider
				value={{ mode: "editor", pageId: page.id, pageUrl: () => "#" }}
			>
				<TooltipProvider delayDuration={300}>
					<Editor
						resolver={resolver}
						onRender={RenderNode}
						indicator={{ success: "#2563eb", error: "#ef4444", thickness: 3 }}
						onNodesChange={() => useSaveState.getState().markChanged()}
					>
						<div className="dark flex h-screen flex-col bg-editor-bg text-foreground">
							<TopBar
								pageName={meta.name}
								pagePath={`/p/${page.projectSlug}/${meta.slug}`}
							/>
							<div className="flex min-h-0 flex-1">
								<LeftPanel meta={meta} onMetaSaved={setMeta} />
								<CanvasFrame onDocument={setCanvasDoc}>
									<Frame data={initialJson} />
								</CanvasFrame>
								<aside className="flex w-80 shrink-0 flex-col border-l border-border bg-editor-panel">
									<ScrollArea className="min-h-0 flex-1">
										<SettingsPanel />
									</ScrollArea>
								</aside>
							</div>
						</div>
						<SectionLibraryDialog />
						<AutosaveController />
						<KeyboardShortcuts canvasDoc={canvasDoc} />
						<DraftRecovery
							pageId={page.id}
							version={page.version}
							serverJson={initialJson}
						/>
					</Editor>
				</TooltipProvider>
			</RenderProvider>
		</EditorContextProvider>
	);
}

/** Oferece restaurar um rascunho local que não chegou a ser salvo no servidor. */
function DraftRecovery({
	pageId,
	version,
	serverJson,
}: {
	pageId: string;
	version: number;
	serverJson: string;
}) {
	const { actions } = useEditor();
	useEffect(() => {
		const draft = readDraft(pageId);
		if (!draft) return;
		if (draft.version !== version || draft.json === serverJson) {
			clearDraft(pageId);
			return;
		}
		toast("Você tem alterações não salvas desta página.", {
			duration: 15000,
			action: {
				label: "Restaurar",
				onClick: () => {
					actions.deserialize(draft.json);
				},
			},
			cancel: { label: "Descartar", onClick: () => clearDraft(pageId) },
		});
	}, [pageId, version, serverJson, actions]);
	return null;
}
