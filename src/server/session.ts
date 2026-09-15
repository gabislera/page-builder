import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await auth.api.getSession({ headers: getRequestHeaders() });
		return session
			? {
					user: {
						id: session.user.id,
						name: session.user.name,
						email: session.user.email,
					},
				}
			: null;
	},
);
