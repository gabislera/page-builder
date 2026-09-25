import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "#/components/auth-form";
import { getSession } from "#/server/session";

export const Route = createFileRoute("/signup")({
  // already signed in: straight to the projects
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: "/projects" });
  },
  component: () => <AuthForm mode="signup" />,
});
