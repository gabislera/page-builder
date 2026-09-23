import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizeSiteSettings } from "#/builder/core/theme";
import { db } from "#/db";
import { asset, page, project, projectMember } from "#/db/schema";
import { isValidSlug, slugify } from "#/lib/slug";
import { ForbiddenError, requireProjectAccess } from "./access.ts";
import { authMiddleware } from "./middleware.ts";
import { deleteObject } from "./s3.ts";

export const listProjects = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const rows = await db
			.select({
				id: project.id,
				name: project.name,
				slug: project.slug,
				role: projectMember.role,
			})
			.from(projectMember)
			.innerJoin(project, eq(project.id, projectMember.projectId))
			.where(eq(projectMember.userId, context.user.id))
			.orderBy(desc(project.createdAt));
		return rows;
	});

export const createProject = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ name: z.string().trim().min(2).max(80) }))
	.handler(async ({ data, context }) => {
		const base = slugify(data.name) || "projeto";
		let slug = base;
		for (
			let i = 2;
			await db.query.project.findFirst({ where: eq(project.slug, slug) });
			i++
		) {
			slug = `${base}-${i}`;
		}
		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(project)
				.values({ name: data.name, slug })
				.returning();
			await tx.insert(projectMember).values({
				projectId: created.id,
				userId: context.user.id,
				role: "owner",
			});
			return created;
		});
	});

/** Nome, endereço e página inicial do projeto (tela de configurações). */
export const getProjectSettings = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ projectId: z.string() }))
	.handler(async ({ data, context }) => {
		const member = await requireProjectAccess(context.user.id, data.projectId);
		const row = await db.query.project.findFirst({
			where: eq(project.id, data.projectId),
		});
		if (!row) throw new Error("Projeto não encontrado");
		const pages = await db
			.select({ id: page.id, name: page.name, slug: page.slug })
			.from(page)
			.where(
				and(
					eq(page.projectId, row.id),
					eq(page.status, "published"),
					sql`${page.deletedAt} is null`,
				),
			)
			.orderBy(page.name);
		return {
			name: row.name,
			slug: row.slug,
			homePageId: normalizeSiteSettings(row.settings).homePageId,
			publishedPages: pages,
			isOwner: member.role === "owner",
		};
	});

export const updateProject = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			projectId: z.string(),
			name: z.string().trim().min(2).max(80).optional(),
			slug: z.string().trim().optional(),
			/** Vazio (null): página inicial automática. */
			homePageId: z.string().nullable().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		const row = await db.query.project.findFirst({
			where: eq(project.id, data.projectId),
		});
		if (!row) throw new Error("Projeto não encontrado");
		const patch: Partial<typeof project.$inferInsert> = {};
		if (data.name) patch.name = data.name;
		if (data.homePageId !== undefined)
			patch.settings = { ...row.settings, homePageId: data.homePageId };
		const slug = data.slug;
		const slugChanged = slug !== undefined && slug !== row.slug;
		if (slugChanged) {
			if (!isValidSlug(slug))
				throw new Error(
					"Endereço inválido: use letras minúsculas, números e hífen",
				);
			const taken = await db.query.project.findFirst({
				where: eq(project.slug, slug),
			});
			if (taken)
				throw new Error("Esse endereço já está em uso por outro projeto");
			patch.slug = slug;
		}
		await db.transaction(async (tx) => {
			await tx.update(project).set(patch).where(eq(project.id, row.id));
			if (slugChanged) {
				// links internos das páginas já publicadas passam a usar o
				// endereço novo (sem republicar, para não levar rascunhos ao ar)
				const from = `/p/${row.slug}`;
				const to = `/p/${slug}`;
				await tx
					.update(page)
					.set({
						publishedHtml: sql`replace(replace(${page.publishedHtml}, ${`"${from}/`}, ${`"${to}/`}), ${`"${from}"`}, ${`"${to}"`})`,
					})
					.where(
						and(eq(page.projectId, row.id), isNotNull(page.publishedHtml)),
					);
			}
		});
		return { ok: true };
	});

/** Exclui o projeto com páginas, leads, visitas e arquivos. Só o dono. */
export const deleteProject = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ projectId: z.string() }))
	.handler(async ({ data, context }) => {
		const member = await requireProjectAccess(context.user.id, data.projectId);
		if (member.role !== "owner")
			throw new ForbiddenError("Só o dono pode excluir o projeto");
		const files = await db
			.select({ key: asset.key })
			.from(asset)
			.where(eq(asset.projectId, data.projectId));
		await db.delete(project).where(eq(project.id, data.projectId));
		// arquivos no armazenamento: melhor esforço (o banco já foi limpo)
		await Promise.allSettled(files.map((f) => deleteObject(f.key)));
		return { ok: true };
	});
