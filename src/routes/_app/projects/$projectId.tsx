import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3, ExternalLink, FileText, Inbox } from "lucide-react";
import { cn } from "#/lib/utils";
import { listProjects } from "#/server/projects";

/** Projeto: título e abas (páginas, leads, visitas). */
export const Route = createFileRoute("/_app/projects/$projectId")({
	component: ProjectLayout,
});

const TABS = [
	{ to: "/projects/$projectId", label: "Páginas", icon: FileText, exact: true },
	{
		to: "/projects/$projectId/leads",
		label: "Leads",
		icon: Inbox,
		exact: false,
	},
	{
		to: "/projects/$projectId/visitas",
		label: "Visitas",
		icon: BarChart3,
		exact: false,
	},
] as const;

function ProjectLayout() {
	const { projectId } = Route.useParams();
	const projects = useQuery({
		queryKey: ["projects"],
		queryFn: () => listProjects(),
	});
	const project = projects.data?.find((p) => p.id === projectId);
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<Link
					to="/projects"
					className="text-xs text-muted-foreground hover:text-foreground"
				>
					← Projetos
				</Link>
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-2xl font-semibold">{project?.name ?? "..."}</h1>
					{project ? (
						<a
							href={`/p/${project.slug}`}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
						>
							/p/{project.slug}
							<ExternalLink className="size-3" />
						</a>
					) : null}
				</div>
			</div>
			<nav className="flex gap-1 border-b border-border">
				{TABS.map(({ to, label, icon: Icon, exact }) => (
					<Link
						key={to}
						to={to}
						params={{ projectId }}
						activeOptions={{ exact }}
						className="-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
						activeProps={{ className: cn("border-primary! text-foreground!") }}
					>
						<Icon className="size-4" />
						{label}
					</Link>
				))}
			</nav>
			<Outlet />
		</div>
	);
}
