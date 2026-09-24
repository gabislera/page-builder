import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db";
import { pageView } from "#/db/schema";

/** View beacon sent by the published page runtime. */
export const Route = createFileRoute("/api/views/$pageId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          // empty-body beacon
        }
        await db
          .insert(pageView)
          .values({
            pageId: params.pageId,
            meta: {
              ref: body.ref ?? null,
              query: body.query ?? {},
              width: body.w ?? null,
              ua: request.headers.get("user-agent"),
            },
          })
          .catch(() => undefined); // missing page: ignore
        return new Response(null, { status: 204 });
      },
    },
  },
});
