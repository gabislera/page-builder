/**
 * Sections saved by the user as templates. They belong to the user and
 * appear in all of their projects.
 */
import type { SerializedNodes } from "@craftjs/core";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { cloneTree } from "#/builder/core/tree";
import { db } from "#/db";
import { sectionTemplate } from "#/db/schema";
import { requireProjectAccess } from "./access.ts";
import { authMiddleware } from "./middleware.ts";

/** Trees that are too large (e.g. a base64-pasted image) are rejected. */
const MAX_BYTES = 2_000_000;

export const listSavedSections = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const rows = await db
      .select({
        id: sectionTemplate.id,
        name: sectionTemplate.name,
        kind: sectionTemplate.kind,
        rootNodeId: sectionTemplate.rootNodeId,
        nodes: sectionTemplate.nodes,
        createdAt: sectionTemplate.createdAt,
      })
      .from(sectionTemplate)
      .where(eq(sectionTemplate.userId, context.user.id))
      .orderBy(desc(sectionTemplate.createdAt));
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  });

export const saveSectionAsTemplate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      projectId: z.string(),
      name: z.string().trim().min(1).max(80),
      kind: z.enum(["section", "header", "footer"]),
      rootNodeId: z.string().min(1),
      nodes: z.record(z.string(), z.any()),
    }),
  )
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const nodes = data.nodes as SerializedNodes;
    if (!nodes[data.rootNodeId]) throw new Error("Seção inválida");
    if (JSON.stringify(nodes).length > MAX_BYTES) throw new Error("Seção grande demais para salvar como modelo");
    // loose copy: no link to a global section or the site header/footer
    const tree = cloneTree(nodes, data.rootNodeId, null);
    const [row] = await db
      .insert(sectionTemplate)
      .values({
        userId: context.user.id,
        category: "Meus modelos",
        name: data.name,
        kind: data.kind,
        rootNodeId: tree.rootNodeId,
        nodes: tree.nodes,
      })
      .returning({ id: sectionTemplate.id });
    return row;
  });

export const deleteSavedSection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await db
      .delete(sectionTemplate)
      .where(and(eq(sectionTemplate.id, data.id), eq(sectionTemplate.userId, context.user.id)));
    return { ok: true };
  });
