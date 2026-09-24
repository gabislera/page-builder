import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { formSubmission, page } from "#/db/schema";

const MAX_FIELDS = 50;
const MAX_VALUE = 5000;

/** Receives form submissions from published pages. */
export const Route = createFileRoute("/api/forms/$pageId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const row = await db.query.page.findFirst({
          where: eq(page.id, params.pageId),
          columns: { id: true, projectId: true, status: true },
        });
        if (!row || row.status !== "published") return Response.json({ ok: false }, { status: 404 });

        const form = await request.formData();
        // honeypot: bots fill the hidden field
        if (form.get("_pb_hp")) return Response.json({ ok: true });

        const data: Record<string, string> = {};
        let count = 0;
        for (const [key, value] of form.entries()) {
          if (key.startsWith("_pb_") || typeof value !== "string") continue;
          if (++count > MAX_FIELDS) break;
          data[key.slice(0, 100)] = value.slice(0, MAX_VALUE);
        }
        await db.insert(formSubmission).values({
          projectId: row.projectId,
          pageId: row.id,
          formName: String(form.get("_pb_form") ?? "Formulário").slice(0, 100),
          data,
          meta: {
            ua: request.headers.get("user-agent"),
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
            url: request.headers.get("referer"),
          },
        });
        return Response.json({ ok: true });
      },
    },
  },
});
