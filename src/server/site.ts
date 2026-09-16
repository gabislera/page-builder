import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { project } from "#/db/schema";
import { requireProjectAccess } from "./access.ts";
import { authMiddleware } from "./middleware.ts";
import { loadSiteSettings, republishProject } from "./page-store.ts";

const hexOrCss = z.string().trim().min(1).max(120);

const themeInput = z.object({
	colors: z
		.array(
			z.object({
				id: z.string().regex(/^[a-z0-9-]{1,40}$/),
				name: z.string().trim().min(1).max(40),
				value: hexOrCss,
				system: z.boolean().optional(),
			}),
		)
		.max(40),
	fonts: z.object({ heading: z.string().max(60), body: z.string().max(60) }),
});

const identityInput = z.object({
	name: z.string().trim().max(80),
	logoUrl: z.string().max(1000),
	logoLightUrl: z.string().max(1000),
});

/** Atualiza tema e/ou identidade do site. Cabeçalho/rodapé mudam pelo editor. */
export const updateSiteSettings = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			projectId: z.string(),
			theme: themeInput.optional(),
			identity: identityInput.optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		const { settings } = await loadSiteSettings(data.projectId);
		const next = {
			...settings,
			...(data.theme ? { theme: data.theme } : {}),
			...(data.identity ? { identity: data.identity } : {}),
		};
		await db
			.update(project)
			.set({ settings: next })
			.where(eq(project.id, data.projectId));
		return (await loadSiteSettings(data.projectId)).settings;
	});

/** Republica as páginas publicadas para aplicar mudanças de tema e identidade. */
export const republishSite = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ projectId: z.string() }))
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		return { count: await republishProject(data.projectId) };
	});
