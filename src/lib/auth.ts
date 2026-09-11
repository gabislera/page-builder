import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { APP_NAME } from "#/lib/brand";

export const auth = betterAuth({
	appName: APP_NAME,
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: { enabled: true, maxAge: 5 * 60 },
	},
	// tanstackStartCookies precisa ser o último plugin
	plugins: [tanstackStartCookies()],
});

export type Session = typeof auth.$Infer.Session;
