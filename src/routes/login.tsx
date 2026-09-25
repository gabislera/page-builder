import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "#/components/auth-form";
import { getSession } from "#/server/session";

export const Route = createFileRoute("/login")({
  // already signed in: straight to the projects
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: "/projects" });
  },
  component: () => <AuthForm mode="login" />,
});
