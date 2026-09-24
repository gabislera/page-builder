import { createFileRoute } from "@tanstack/react-router";
import { serveSitemap } from "#/server/public-pages";

export const Route = createFileRoute("/p/$projectSlug/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ params, request }) => serveSitemap(params.projectSlug, new URL(request.url).origin),
    },
  },
});
