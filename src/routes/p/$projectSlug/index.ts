import { createFileRoute } from "@tanstack/react-router";
import { servePublished } from "#/server/public-pages";

/** Endereço do site (/p/projeto): mostra a página inicial publicada. */
export const Route = createFileRoute("/p/$projectSlug/")({
	server: {
		handlers: {
			GET: ({ params }) => servePublished(params.projectSlug),
		},
	},
});
