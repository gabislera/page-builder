import { createFileRoute } from "@tanstack/react-router";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "#/db";
import { page, project } from "#/db/schema";

/** Página publicada, servida como HTML estático gerado na publicação. */
export const Route = createFileRoute("/p/$projectSlug/$pageSlug")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const proj = await db.query.project.findFirst({
					where: eq(project.slug, params.projectSlug),
				});
				const row = proj
					? await db.query.page.findFirst({
							where: and(
								eq(page.projectId, proj.id),
								eq(page.slug, params.pageSlug),
								isNull(page.deletedAt),
							),
							columns: { publishedHtml: true },
						})
					: null;
				if (!row?.publishedHtml) {
					return new Response(
						"<!doctype html><title>Página não encontrada</title><h1>Página não encontrada</h1>",
						{
							status: 404,
							headers: { "Content-Type": "text/html; charset=utf-8" },
						},
					);
				}
				return new Response(row.publishedHtml, {
					headers: {
						"Content-Type": "text/html; charset=utf-8",
						"Cache-Control":
							"public, max-age=0, s-maxage=60, stale-while-revalidate=300",
					},
				});
			},
		},
	},
});
