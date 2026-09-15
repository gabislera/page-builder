import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import type { EditorServices } from "#/builder/editor/context";
import { EditorShell } from "#/builder/editor/editor-shell";
import { APP_NAME } from "#/lib/brand";
import {
	createUpload,
	deleteAsset,
	listAssets,
	registerAsset,
} from "#/server/assets";
import {
	getEditorPage,
	listGlobalSections,
	listPages,
	publishPage,
	savePage,
	updatePageSettings,
} from "#/server/pages";
import { getSession } from "#/server/session";

export const Route = createFileRoute("/editor/$pageId")({
	// o Craft.js roda só no navegador
	ssr: false,
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/login" });
	},
	loader: ({ params }) => getEditorPage({ data: { pageId: params.pageId } }),
	head: ({ loaderData }) => ({
		meta: [{ title: `${loaderData?.page.name ?? "Editor"} · ${APP_NAME}` }],
	}),
	pendingComponent: () => (
		<div className="flex h-screen items-center justify-center bg-editor-bg text-sm text-muted-foreground">
			Carregando editor...
		</div>
	),
	component: EditorRoute,
});

function EditorRoute() {
	const { page, nodes } = Route.useLoaderData();

	const services = useMemo<EditorServices>(() => {
		const { id: pageId, projectId } = page;
		return {
			listPages: () => listPages({ data: { projectId } }),
			listAssets: () => listAssets({ data: { projectId } }),
			uploadAsset: async (file) => {
				const { uploadUrl, key } = await createUpload({
					data: {
						projectId,
						name: file.name,
						mimeType: file.type,
						size: file.size,
					},
				});
				const res = await fetch(uploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});
				if (!res.ok) throw new Error("Falha no envio do arquivo");
				return registerAsset({
					data: {
						projectId,
						key,
						name: file.name,
						mimeType: file.type,
						size: file.size,
					},
				});
			},
			deleteAsset: (assetId) => deleteAsset({ data: { projectId, assetId } }),
			listGlobalSections: () => listGlobalSections({ data: { projectId } }),
			savePage: (input) => savePage({ data: { pageId, ...input } }),
			publishPage: (republish) => publishPage({ data: { pageId, republish } }),
			updateSettings: (patch) =>
				updatePageSettings({ data: { pageId, ...patch } }),
		};
	}, [page]);

	return <EditorShell page={page} nodes={nodes} services={services} />;
}
