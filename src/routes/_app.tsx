import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { APP_NAME } from "#/lib/brand";
import { getSession } from "#/server/session";

export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ to: "/login" });
		return { user: session.user };
	},
	component: AppLayout,
});

function AppLayout() {
	const { user } = Route.useRouteContext();
	const router = useRouter();
	return (
		<div className="min-h-screen bg-editor-bg">
			<header className="flex h-14 items-center justify-between border-b border-border px-6">
				<Link to="/projects" className="text-sm font-semibold">
					{APP_NAME}
				</Link>
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					{user.name}
					<Button
						variant="ghost"
						size="icon"
						title="Sair"
						onClick={async () => {
							await authClient.signOut();
							router.navigate({ to: "/login" });
						}}
					>
						<LogOut className="size-4" />
					</Button>
				</div>
			</header>
			<main className="mx-auto max-w-6xl p-6">
				<Outlet />
			</main>
		</div>
	);
}
