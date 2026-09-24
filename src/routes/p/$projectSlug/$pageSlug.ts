import { createFileRoute } from "@tanstack/react-router";
import { servePublished } from "#/server/public-pages";

/** Published page, served as static HTML generated on publish. */
export const Route = createFileRoute("/p/$projectSlug/$pageSlug")({
  server: {
    handlers: {
      GET: ({ params }) => servePublished(params.projectSlug, params.pageSlug),
    },
  },
});
