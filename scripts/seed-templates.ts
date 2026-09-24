/**
 * Create (or recreate) one page per template in a project, for review.
 * Usage: pnpm tsx --env-file=.env.local scripts/seed-templates.ts <projectId>
 */
import { and, eq, inArray } from "drizzle-orm";
import { buildPageTemplate, PAGE_TEMPLATES } from "#/builder/templates/pages.ts";
import { db } from "#/db/index.ts";
import { page, pageSection, section } from "#/db/schema/index.ts";
import { insertSections, publishPageById } from "#/server/page-store.ts";

const projectId = process.argv[2];
if (!projectId) throw new Error("Informe o projectId");

for (const template of PAGE_TEMPLATES) {
	const slug = `modelo-${template.id}`;
	const existing = await db.query.page.findFirst({
		where: and(eq(page.projectId, projectId), eq(page.slug, slug)),
	});
	if (existing) {
		const links = await db
			.select({ sectionId: pageSection.sectionId })
			.from(pageSection)
			.where(eq(pageSection.pageId, existing.id));
		await db.delete(pageSection).where(eq(pageSection.pageId, existing.id));
		await db.delete(page).where(eq(page.id, existing.id));
		const ids = links.map((l) => l.sectionId);
		if (ids.length)
			await db
				.delete(section)
				.where(and(inArray(section.id, ids), eq(section.isGlobal, false)));
	}
	const tree = buildPageTemplate(template);
	const created = await db.transaction(async (tx) => {
		const [row] = await tx
			.insert(page)
			.values({
				projectId,
				name: template.name,
				slug,
				root: tree.root,
				seo: { title: template.name },
				headerMode: template.headerMode,
				footerMode: template.footerMode,
			})
			.returning({ id: page.id });
		await insertSections(tx, projectId, row.id, tree.sections);
		return row;
	});
	console.log(JSON.stringify({ template: template.id, pageId: created.id, ...(await publishPageById(created.id)) }));
}
process.exit(0);
