import { createFileRoute } from "@tanstack/react-router";
import { serveRobots } from "#/server/public-pages";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => serveRobots(new URL(request.url).origin),
    },
  },
});
