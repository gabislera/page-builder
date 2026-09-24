import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/db";
import { pageView } from "#/db/schema";

/** Beacon de visualização enviado pelo runtime da página publicada. */
export const Route = createFileRoute("/api/views/$pageId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          // beacon sem corpo
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
          .catch(() => undefined); // página inexistente: ignora
        return new Response(null, { status: 204 });
      },
    },
  },
});
