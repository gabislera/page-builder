import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { cn } from "#/lib/utils";
import { getInsights } from "#/server/insights";

export const Route = createFileRoute("/_app/projects/$projectId/visitas")({
	component: VisitsPage,
});

const ALL = "__all";
const PERIODS = [
	{ value: "7", label: "Últimos 7 dias" },
	{ value: "30", label: "Últimos 30 dias" },
	{ value: "90", label: "Últimos 90 dias" },
];

type Insights = Awaited<ReturnType<typeof getInsights>>;

const n = (v: number) => v.toLocaleString("pt-BR");
const pct = (v: number) =>
	`${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

function VisitsPage() {
	const { projectId } = Route.useParams();
	const [period, setPeriod] = useState("30");
	const [pageId, setPageId] = useState(ALL);
	const insights = useQuery({
		queryKey: ["insights", projectId, period, pageId],
		queryFn: () =>
			getInsights({
				data: {
					projectId,
					days: Number(period),
					pageId: pageId === ALL ? undefined : pageId,
				},
			}),
		placeholderData: (prev) => prev,
	});
	// a lista de páginas do filtro vem da consulta sem filtro de página
	const [pageOptions, setPageOptions] = useState<Insights["pages"]>([]);
	if (pageId === ALL && insights.data && insights.data.pages !== pageOptions)
		setPageOptions(insights.data.pages);
	const d = insights.data;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center gap-2">
				<Select value={pageId} onValueChange={setPageId}>
					<SelectTrigger className="w-56">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>Todas as páginas</SelectItem>
						{pageOptions.map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={period} onValueChange={setPeriod}>
					<SelectTrigger className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{PERIODS.map((p) => (
							<SelectItem key={p.value} value={p.value}>
								{p.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{insights.isFetching ? (
					<Loader2 className="size-4 animate-spin text-muted-foreground" />
				) : null}
			</div>

			{insights.isError ? (
				<p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
					Não foi possível carregar as visitas: {insights.error.message}
				</p>
			) : null}

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<Kpi label="Visitas" value={d ? n(d.totals.views) : "—"} />
				<Kpi label="Leads" value={d ? n(d.totals.leads) : "—"} />
				<Kpi
					label="Conversão"
					value={d ? pct(d.totals.conversion) : "—"}
					hint="Leads ÷ visitas no período"
				/>
			</div>

			<Panel title="Visitas e leads por dia">
				{d ? <DailyChart daily={d.daily} /> : <div className="h-56" />}
			</Panel>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Panel title="Páginas" className="lg:col-span-2">
					{d?.pages.length ? (
						<table className="w-full text-sm">
							<thead className="text-left text-xs text-muted-foreground">
								<tr>
									<th className="pb-2 font-medium">Página</th>
									<th className="pb-2 text-right font-medium">Visitas</th>
									<th className="pb-2 text-right font-medium">Leads</th>
									<th className="pb-2 text-right font-medium">Conversão</th>
								</tr>
							</thead>
							<tbody>
								{d.pages.map((p) => (
									<tr key={p.id} className="border-t border-border">
										<td className="max-w-64 truncate py-2.5">
											<Link
												to="/editor/$pageId"
												params={{ pageId: p.id }}
												className="hover:text-primary"
											>
												{p.name}
											</Link>
											{p.status !== "published" ? (
												<span className="ml-2 text-xs text-muted-foreground">
													(rascunho)
												</span>
											) : null}
										</td>
										<td className="py-2.5 text-right tabular-nums">
											{n(p.views)}
										</td>
										<td className="py-2.5 text-right tabular-nums">
											{n(p.leads)}
										</td>
										<td className="py-2.5 text-right text-muted-foreground tabular-nums">
											{p.views ? pct(p.leads / p.views) : "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<Empty />
					)}
				</Panel>
				<div className="flex flex-col gap-4">
					<Panel title="Origens">
						{d?.sources.length ? (
							<Bars
								items={d.sources.map((s) => ({
									label: s.source,
									value: s.views,
								}))}
							/>
						) : (
							<Empty />
						)}
					</Panel>
					<Panel title="Dispositivos">
						{d?.totals.views ? (
							<Devices mobile={d.devices.mobile} desktop={d.devices.desktop} />
						) : (
							<Empty />
						)}
					</Panel>
				</div>
			</div>
		</div>
	);
}

function Kpi({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div
			className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
			title={hint}
		>
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-2xl font-semibold tabular-nums">{value}</span>
		</div>
	);
}

function Panel({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
				className,
			)}
		>
			<h2 className="text-sm font-medium">{title}</h2>
			{children}
		</section>
	);
}

function Empty() {
	return (
		<p className="py-6 text-center text-sm text-muted-foreground">
			Sem dados no período.
		</p>
	);
}

/** Barras de visitas por dia, com os leads em destaque dentro de cada barra. */
function DailyChart({ daily }: { daily: Insights["daily"] }) {
	const max = Math.max(1, ...daily.map((x) => x.views));
	const label = (day: string) => {
		const [, m, dd] = day.split("-");
		return `${dd}/${m}`;
	};
	const every = Math.ceil(daily.length / 8);
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-4 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-sm bg-muted-foreground/40" />{" "}
					Visitas
				</span>
				<span className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-sm bg-primary" /> Leads
				</span>
				<span className="ml-auto">máx. {n(max)} visitas/dia</span>
			</div>
			<div className="flex h-56 items-end gap-[2px]">
				{daily.map((x) => (
					<div
						key={x.day}
						title={`${label(x.day)}: ${n(x.views)} visitas, ${n(x.leads)} leads`}
						className="group relative flex h-full flex-1 items-end"
					>
						<div
							className="relative w-full rounded-t-sm bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/50"
							style={{
								height: `${(x.views / max) * 100}%`,
								minHeight: x.views ? 2 : 0,
							}}
						>
							<div
								className="absolute inset-x-0 bottom-0 rounded-t-sm bg-primary"
								style={{
									height: x.views
										? `${Math.min(100, (x.leads / x.views) * 100)}%`
										: 0,
									minHeight: x.leads ? 2 : 0,
								}}
							/>
						</div>
					</div>
				))}
			</div>
			<div className="flex gap-[2px] text-[10px] text-muted-foreground">
				{daily.map((x, i) => (
					<span key={x.day} className="flex-1 text-center">
						{i % every === 0 ? label(x.day) : ""}
					</span>
				))}
			</div>
		</div>
	);
}

function Bars({ items }: { items: { label: string; value: number }[] }) {
	const max = Math.max(1, ...items.map((i) => i.value));
	return (
		<ul className="flex flex-col gap-2">
			{items.map((i) => (
				<li key={i.label} className="flex flex-col gap-1 text-sm">
					<div className="flex justify-between gap-2">
						<span className="truncate">{i.label}</span>
						<span className="text-muted-foreground tabular-nums">
							{n(i.value)}
						</span>
					</div>
					<div className="h-1.5 rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary/70"
							style={{ width: `${(i.value / max) * 100}%` }}
						/>
					</div>
				</li>
			))}
		</ul>
	);
}

function Devices({ mobile, desktop }: { mobile: number; desktop: number }) {
	const total = mobile + desktop || 1;
	const rows = [
		{ label: "Celular", value: mobile, icon: Smartphone },
		{ label: "Computador", value: desktop, icon: Monitor },
	];
	return (
		<div className="flex flex-col gap-3">
			<div className="flex h-2 overflow-hidden rounded-full bg-muted">
				<div
					className="bg-primary"
					style={{ width: `${(mobile / total) * 100}%` }}
				/>
			</div>
			{rows.map(({ label, value, icon: Icon }) => (
				<div key={label} className="flex items-center justify-between text-sm">
					<span className="flex items-center gap-2">
						<Icon className="size-4 text-muted-foreground" /> {label}
					</span>
					<span className="text-muted-foreground tabular-nums">
						{n(value)} · {pct(value / total)}
					</span>
				</div>
			))}
		</div>
	);
}
