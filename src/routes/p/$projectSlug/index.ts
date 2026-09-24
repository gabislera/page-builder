import { createFileRoute } from "@tanstack/react-router";
import { servePublished } from "#/server/public-pages";

/** Site URL (/p/project): shows the published home page. */
export const Route = createFileRoute("/p/$projectSlug/")({
  server: {
    handlers: {
      GET: ({ params }) => servePublished(params.projectSlug),
    },
  },
});
