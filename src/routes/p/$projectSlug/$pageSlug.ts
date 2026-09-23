import { createFileRoute } from "@tanstack/react-router";
import { servePublished } from "#/server/public-pages";

/** Página publicada, servida como HTML estático gerado na publicação. */
export const Route = createFileRoute("/p/$projectSlug/$pageSlug")({
	server: {
		handlers: {
			GET: ({ params }) => servePublished(params.projectSlug, params.pageSlug),
		},
	},
});
