import { isNotNull } from "drizzle-orm";
import { db } from "#/db/index.ts";
import { page } from "#/db/schema/index.ts";
import { publishPageById } from "#/server/page-store.ts";
const rows = await db.select({ id: page.id }).from(page).where(isNotNull(page.publishedHtml));
for (const r of rows) console.log(await publishPageById(r.id));
process.exit(0);
