import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { project, projectMember } from "#/db/schema";
import { slugify } from "#/lib/slug";
import { authMiddleware } from "./middleware.ts";

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
