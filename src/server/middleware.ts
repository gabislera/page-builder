import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

/** Require a valid session and inject the user into the server function context. */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  if (!session) throw new Error("UNAUTHORIZED");
  return next({ context: { user: session.user } });
});
