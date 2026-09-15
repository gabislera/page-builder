import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "#/db";
import { asset } from "#/db/schema";
import { requireProjectAccess } from "./access.ts";
import { authMiddleware } from "./middleware.ts";
import { deleteObject, presignUpload, publicUrl } from "./s3.ts";

const MAX_SIZE: Record<string, number> = {
	image: 10 * 1024 * 1024,
	video: 100 * 1024 * 1024,
};

const ALLOWED =
	/^(image\/(png|jpe?g|webp|gif|svg\+xml|avif|x-icon|vnd\.microsoft\.icon)|video\/(mp4|webm))$/;

export const listAssets = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ projectId: z.string() }))
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		return db.query.asset.findMany({
			where: eq(asset.projectId, data.projectId),
			orderBy: desc(asset.createdAt),
			limit: 200,
		});
	});

/** Gera URL pré-assinada. O navegador envia o arquivo direto para o S3. */
export const createUpload = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			projectId: z.string(),
			name: z.string().min(1).max(200),
			mimeType: z.string().regex(ALLOWED, "Tipo de arquivo não permitido"),
			size: z.number().int().positive(),
		}),
	)
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		const kind = data.mimeType.startsWith("video/") ? "video" : "image";
		if (data.size > MAX_SIZE[kind]) {
			throw new Error(`Arquivo maior que ${MAX_SIZE[kind] / 1024 / 1024} MB`);
		}
		const ext = data.name.includes(".")
			? data.name.split(".").pop()?.toLowerCase()
			: "";
		const key = `${data.projectId}/${nanoid(12)}${ext ? `.${ext}` : ""}`;
		const uploadUrl = await presignUpload(key, data.mimeType, data.size);
		return { uploadUrl, key };
	});

/** Registra o asset depois que o upload terminou. */
export const registerAsset = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			projectId: z.string(),
			key: z.string(),
			name: z.string(),
			mimeType: z.string().regex(ALLOWED),
			size: z.number().int().positive(),
		}),
	)
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		if (!data.key.startsWith(`${data.projectId}/`))
			throw new Error("Chave inválida");
		const [row] = await db
			.insert(asset)
			.values({ ...data, url: publicUrl(data.key) })
			.returning();
		return row;
	});

export const deleteAsset = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(z.object({ projectId: z.string(), assetId: z.string() }))
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		const [row] = await db
			.delete(asset)
			.where(
				and(eq(asset.id, data.assetId), eq(asset.projectId, data.projectId)),
			)
			.returning();
		if (row) await deleteObject(row.key).catch(() => undefined);
		return { ok: true };
	});
