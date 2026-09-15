import { and, eq, isNull } from "drizzle-orm";
import { db } from "#/db";
import { page, projectMember } from "#/db/schema";

export class ForbiddenError extends Error {
	constructor(message = "Sem permissão para este projeto") {
		super(message);
	}
}

export async function requireProjectAccess(userId: string, projectId: string) {
	const member = await db.query.projectMember.findFirst({
		where: and(
			eq(projectMember.projectId, projectId),
			eq(projectMember.userId, userId),
		),
	});
	if (!member) throw new ForbiddenError();
	return member;
}

/** Carrega a página e confirma que o usuário tem acesso ao projeto dela. */
export async function requirePageAccess(userId: string, pageId: string) {
	const row = await db.query.page.findFirst({
		where: and(eq(page.id, pageId), isNull(page.deletedAt)),
	});
	if (!row) throw new Error("Página não encontrada");
	await requireProjectAccess(userId, row.projectId);
	return row;
}
