/**
 * Dados de demonstração para as abas Leads e Visitas: visitas e envios de
 * formulário espalhados pelos últimos 30 dias nas páginas publicadas.
 * Uso: pnpm tsx --env-file=.env.local scripts/seed-insights.ts <projectId>
 */
import { and, eq, isNull } from "drizzle-orm";
import { db } from "#/db/index.ts";
import { formSubmission, page, pageView } from "#/db/schema/index.ts";

const projectId = process.argv[2];
if (!projectId) throw new Error("Informe o projectId");

const pages = await db
	.select({ id: page.id, slug: page.slug })
	.from(page)
	.where(and(eq(page.projectId, projectId), eq(page.status, "published"), isNull(page.deletedAt)));

const SOURCES = [
	{ query: { utm_source: "instagram", utm_medium: "social" }, ref: "https://l.instagram.com/" },
	{ query: { utm_source: "facebook", utm_medium: "cpc", utm_campaign: "lancamento" }, ref: "https://m.facebook.com/" },
	{ query: { utm_source: "google", utm_medium: "cpc" }, ref: "https://www.google.com/" },
	{ query: {}, ref: "https://www.google.com/" },
	{ query: {}, ref: "https://www.youtube.com/" },
	{ query: {}, ref: null },
];
const NAMES = ["Ana Souza", "Bruno Lima", "Carla Dias", "Diego Rocha", "Elisa Martins", "Felipe Alves", "Gabriela Nunes", "Henrique Costa", "Isabela Ramos", "João Pedro", "Larissa Melo", "Marcos Vinícius", "Natália Freitas", "Otávio Reis", "Paula Cardoso"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const views: (typeof pageView.$inferInsert)[] = [];
const leads: (typeof formSubmission.$inferInsert)[] = [];
for (const p of pages) {
	const weight = p.slug.startsWith("modelo") ? 3 : 1;
	for (let day = 29; day >= 0; day--) {
		// tendência de alta com variação diária
		const count = Math.round((20 + (29 - day) * 2 + Math.random() * 25) * weight * 0.4);
		for (let i = 0; i < count; i++) {
			const at = new Date(Date.now() - day * 86_400_000 - Math.random() * 86_400_000);
			const src = pick(SOURCES);
			views.push({
				pageId: p.id,
				createdAt: at,
				meta: { ref: src.ref, query: src.query, width: Math.random() < 0.68 ? 390 : 1440, ua: "demo" },
			});
			if (Math.random() < 0.06) {
				const name = pick(NAMES);
				const user = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
				leads.push({
					projectId,
					pageId: p.id,
					formName: p.slug === "modelo-capture" ? "Aula gratuita" : "Formulário",
					createdAt: at,
					data: {
						nome: name,
						email: `${user}@exemplo.com`,
						whatsapp: `55119${String(Math.floor(10000000 + Math.random() * 89999999))}`,
						...(src.query as Record<string, string>),
					},
					meta: { ua: "demo", url: `http://localhost:3100/p/demo/${p.slug}` },
				});
			}
		}
	}
}
for (let i = 0; i < views.length; i += 2000) await db.insert(pageView).values(views.slice(i, i + 2000));
for (let i = 0; i < leads.length; i += 1000) await db.insert(formSubmission).values(leads.slice(i, i + 1000));
console.log(JSON.stringify({ pages: pages.length, views: views.length, leads: leads.length }));
process.exit(0);
