import type { SerializedNode, SerializedNodes } from "@craftjs/core";
import { relations, sql } from "drizzle-orm";
import {
	bigserial,
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import type { SiteSettings } from "#/builder/core/theme";
import { user } from "./auth.ts";

const id = () =>
	text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(16));

const timestamps = {
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
};

/* ------------------------------------------------------------------ */
/* Tipos dos campos JSON                                               */
/* ------------------------------------------------------------------ */

export type PageSeo = {
	title?: string;
	description?: string;
	faviconUrl?: string;
	ogImageUrl?: string;
	noIndex?: boolean;
};

export type PageTracking = {
	facebookPixelId?: string;
	googleTagId?: string;
	tiktokPixelId?: string;
	headScripts?: string;
	bodyScripts?: string;
};

/** Árvore de nós Craft de uma seção. A chave `rootNodeId` aponta o nó raiz. */
export type SectionNodes = SerializedNodes;

/* ------------------------------------------------------------------ */
/* Projetos                                                            */
/* ------------------------------------------------------------------ */

export const projectRole = pgEnum("project_role", ["owner", "editor"]);

export const project = pgTable("project", {
	id: id(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	/** Tema global, identidade e cabeçalho/rodapé padrão do site. */
	settings: jsonb("settings")
		.$type<Partial<SiteSettings>>()
		.notNull()
		.default({}),
	...timestamps,
});

export const projectMember = pgTable(
	"project_member",
	{
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: projectRole("role").notNull().default("editor"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.projectId, t.userId] }),
		index("project_member_user_idx").on(t.userId),
	],
);

/* ------------------------------------------------------------------ */
/* Páginas e seções                                                    */
/* ------------------------------------------------------------------ */

export const pageStatus = pgEnum("page_status", ["draft", "published"]);

/**
 * De onde vem o cabeçalho/rodapé da página:
 * - site: o padrão do projeto (muda junto em todas as páginas)
 * - none: a página não tem
 * - custom: a página tem um próprio (salvo nas seções dela)
 */
export const sitePartMode = pgEnum("site_part_mode", [
	"site",
	"none",
	"custom",
]);

export const page = pgTable(
	"page",
	{
		id: id(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		status: pageStatus("status").notNull().default("draft"),
		headerMode: sitePartMode("header_mode").notNull().default("site"),
		footerMode: sitePartMode("footer_mode").notNull().default("site"),
		/** Nó ROOT (componente Page) serializado: estilos globais da página. */
		root: jsonb("root").$type<SerializedNode>().notNull(),
		seo: jsonb("seo").$type<PageSeo>().notNull().default({}),
		tracking: jsonb("tracking").$type<PageTracking>().notNull().default({}),
		/** Incrementa a cada save. Usado para detectar edição concorrente. */
		version: integer("version").notNull().default(1),
		publishedHtml: text("published_html"),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		...timestamps,
	},
	(t) => [
		uniqueIndex("page_project_slug_uq")
			.on(t.projectId, t.slug)
			.where(sql`${t.deletedAt} is null`),
		index("page_project_idx").on(t.projectId),
	],
);

export const sectionKind = pgEnum("section_kind", [
	"section",
	"header",
	"footer",
]);

/**
 * Uma seção é um bloco independente (Section, Header ou Footer) com sua
 * própria árvore de nós. Seções globais são reutilizadas por várias páginas.
 */
export const section = pgTable(
	"section",
	{
		id: id(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		kind: sectionKind("kind").notNull().default("section"),
		name: text("name").notNull(),
		rootNodeId: text("root_node_id").notNull(),
		nodes: jsonb("nodes").$type<SectionNodes>().notNull(),
		isGlobal: boolean("is_global").notNull().default(false),
		...timestamps,
	},
	(t) => [
		index("section_project_idx").on(t.projectId),
		uniqueIndex("section_root_node_uq").on(t.projectId, t.rootNodeId),
	],
);

export const pageSection = pgTable(
	"page_section",
	{
		pageId: text("page_id")
			.notNull()
			.references(() => page.id, { onDelete: "cascade" }),
		sectionId: text("section_id")
			.notNull()
			.references(() => section.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.pageId, t.sectionId] }),
		index("page_section_section_idx").on(t.sectionId),
	],
);

/** Modelos de seção. `projectId` nulo = modelo do sistema. */
export const sectionTemplate = pgTable("section_template", {
	id: id(),
	projectId: text("project_id").references(() => project.id, {
		onDelete: "cascade",
	}),
	category: text("category").notNull(),
	name: text("name").notNull(),
	kind: sectionKind("kind").notNull().default("section"),
	rootNodeId: text("root_node_id").notNull(),
	nodes: jsonb("nodes").$type<SectionNodes>().notNull(),
	thumbnailUrl: text("thumbnail_url"),
	...timestamps,
});

/* ------------------------------------------------------------------ */
/* Assets, formulários e visitas                                       */
/* ------------------------------------------------------------------ */

export const asset = pgTable(
	"asset",
	{
		id: id(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		key: text("key").notNull(),
		url: text("url").notNull(),
		name: text("name").notNull(),
		mimeType: text("mime_type").notNull(),
		size: integer("size").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [index("asset_project_idx").on(t.projectId)],
);

export const formSubmission = pgTable(
	"form_submission",
	{
		id: id(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		pageId: text("page_id")
			.notNull()
			.references(() => page.id, { onDelete: "cascade" }),
		formName: text("form_name").notNull(),
		data: jsonb("data").$type<Record<string, string>>().notNull(),
		meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [index("form_submission_page_idx").on(t.pageId, t.createdAt)],
);

export const pageView = pgTable(
	"page_view",
	{
		id: bigserial("id", { mode: "number" }).primaryKey(),
		pageId: text("page_id")
			.notNull()
			.references(() => page.id, { onDelete: "cascade" }),
		meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [index("page_view_page_idx").on(t.pageId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Relações                                                            */
/* ------------------------------------------------------------------ */

export const projectRelations = relations(project, ({ many }) => ({
	members: many(projectMember),
	pages: many(page),
	sections: many(section),
}));

export const projectMemberRelations = relations(projectMember, ({ one }) => ({
	project: one(project, {
		fields: [projectMember.projectId],
		references: [project.id],
	}),
	user: one(user, { fields: [projectMember.userId], references: [user.id] }),
}));

export const pageRelations = relations(page, ({ one, many }) => ({
	project: one(project, { fields: [page.projectId], references: [project.id] }),
	sections: many(pageSection),
}));

export const sectionRelations = relations(section, ({ one, many }) => ({
	project: one(project, {
		fields: [section.projectId],
		references: [project.id],
	}),
	pages: many(pageSection),
}));

export const pageSectionRelations = relations(pageSection, ({ one }) => ({
	page: one(page, { fields: [pageSection.pageId], references: [page.id] }),
	section: one(section, {
		fields: [pageSection.sectionId],
		references: [section.id],
	}),
}));
