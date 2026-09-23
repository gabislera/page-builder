import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Download,
	ExternalLink,
	Inbox,
	Loader2,
	MessageCircle,
	Search,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { confirm } from "#/components/confirm-dialog";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { deleteLead, exportLeadsCsv, listLeads } from "#/server/insights";

export const Route = createFileRoute("/_app/projects/$projectId/leads")({
	component: LeadsPage,
});

const ALL = "__all";
const PERIODS = [
	{ value: "7", label: "Últimos 7 dias" },
	{ value: "30", label: "Últimos 30 dias" },
	{ value: "90", label: "Últimos 90 dias" },
	{ value: ALL, label: "Todo o período" },
];

type Lead = Awaited<ReturnType<typeof listLeads>>["items"][number];

/** "e_mail" → "E-mail", "whatsapp" → "WhatsApp", "nome_completo" → "Nome completo". */
function fieldLabel(key: string) {
	const known: Record<string, string> = {
		email: "E-mail",
		e_mail: "E-mail",
		whatsapp: "WhatsApp",
		telefone: "Telefone",
		nome: "Nome",
		utm_source: "Origem (utm_source)",
		utm_medium: "Mídia (utm_medium)",
		utm_campaign: "Campanha (utm_campaign)",
		utm_content: "Conteúdo (utm_content)",
		utm_term: "Termo (utm_term)",
	};
	if (known[key]) return known[key];
	const t = key.replace(/_/g, " ");
	return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "5511987654321" → "+55 (11) 98765-4321". */
function formatPhone(v: string) {
	const d = v.replace(/\D/g, "");
	const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
	return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : v;
}

const isPhoneKey = (k: string) => /whats|telefone|phone|celular/i.test(k);
const display = (key: string, value: string | undefined) =>
	value ? (isPhoneKey(key) ? formatPhone(value) : value) : "";

const dateTime = (iso: string) =>
	new Date(iso).toLocaleString("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	});

function useDebounced<T>(value: T, ms = 300) {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}

function LeadsPage() {
	const { projectId } = Route.useParams();
	const queryClient = useQueryClient();
	const [pageId, setPageId] = useState(ALL);
	const [formName, setFormName] = useState(ALL);
	const [period, setPeriod] = useState("30");
	const [search, setSearch] = useState("");
	const q = useDebounced(search.trim());
	const [open, setOpen] = useState<Lead | null>(null);

	const filters = {
		projectId,
		pageId: pageId === ALL ? undefined : pageId,
		formName: formName === ALL ? undefined : formName,
		days: period === ALL ? undefined : Number(period),
		q: q || undefined,
	};
	const leads = useInfiniteQuery({
		queryKey: ["leads", filters],
		queryFn: ({ pageParam }) =>
			listLeads({ data: { ...filters, offset: pageParam } }),
		initialPageParam: 0,
		getNextPageParam: (last) => last.nextOffset ?? undefined,
		placeholderData: (prev) => prev,
	});
	const first = leads.data?.pages[0];
	const items = leads.data?.pages.flatMap((p) => p.items) ?? [];
	// até 3 campos na tabela; o resto aparece nos detalhes
	const columns = (first?.columns ?? []).slice(0, 3);

	const exportCsv = useMutation({
		mutationFn: () => exportLeadsCsv({ data: filters }),
		onSuccess: (csv) => {
			const url = URL.createObjectURL(
				new Blob([csv], { type: "text/csv;charset=utf-8" }),
			);
			const a = document.createElement("a");
			a.href = url;
			a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		},
		onError: (e) => toast.error(e.message),
	});

	const remove = useMutation({
		mutationFn: (id: string) => deleteLead({ data: { projectId, id } }),
		onSuccess: () => {
			setOpen(null);
			toast.success("Lead excluído");
			queryClient.invalidateQueries({ queryKey: ["leads"] });
		},
		onError: (e) => toast.error(e.message),
	});

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-56 flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						className="pl-9"
						placeholder="Buscar por nome, e-mail, telefone..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select value={pageId} onValueChange={setPageId}>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>Todas as páginas</SelectItem>
						{first?.pages.map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{first && first.forms.length > 1 ? (
					<Select value={formName} onValueChange={setFormName}>
						<SelectTrigger className="w-44">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>Todos os formulários</SelectItem>
							{first.forms.map((f) => (
								<SelectItem key={f} value={f}>
									{f}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : null}
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
				<Button
					variant="outline"
					disabled={!first?.total || exportCsv.isPending}
					onClick={() => exportCsv.mutate()}
				>
					{exportCsv.isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Download className="size-4" />
					)}
					Exportar CSV
				</Button>
			</div>

			<p className="text-sm text-muted-foreground">
				{first
					? `${first.total.toLocaleString("pt-BR")} ${first.total === 1 ? "lead" : "leads"}`
					: "Carregando..."}
			</p>

			{first && first.total === 0 ? (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-12 text-center">
					<Inbox className="size-8 text-muted-foreground" />
					<p className="font-medium">Nenhum lead encontrado</p>
					<p className="max-w-sm text-sm text-muted-foreground">
						{q || pageId !== ALL || formName !== ALL || period !== ALL
							? "Tente mudar os filtros ou o período."
							: "Quando alguém preencher um formulário de uma página publicada, o contato aparece aqui."}
					</p>
				</div>
			) : null}

			{items.length ? (
				<div className="overflow-x-auto rounded-xl border border-border">
					<table className="w-full text-sm">
						<thead className="bg-card text-left text-xs text-muted-foreground">
							<tr>
								<th className="px-4 py-3 font-medium">Data</th>
								{columns.map((c) => (
									<th key={c} className="px-4 py-3 font-medium">
										{fieldLabel(c)}
									</th>
								))}
								<th className="px-4 py-3 font-medium">Página</th>
								<th className="px-4 py-3 font-medium">Origem</th>
							</tr>
						</thead>
						<tbody>
							{items.map((lead) => (
								<tr
									key={lead.id}
									onClick={() => setOpen(lead)}
									className="cursor-pointer border-t border-border bg-card/40 transition-colors hover:bg-accent/60"
								>
									<td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
										{dateTime(lead.createdAt)}
									</td>
									{columns.map((c) => (
										<td key={c} className="max-w-56 truncate px-4 py-3">
											{display(c, lead.data[c]) || (
												<span className="text-muted-foreground">—</span>
											)}
										</td>
									))}
									<td className="max-w-44 truncate px-4 py-3 text-muted-foreground">
										{lead.pageName}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{lead.source ?? "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : null}

			{leads.hasNextPage ? (
				<Button
					variant="outline"
					className="self-center"
					disabled={leads.isFetchingNextPage}
					onClick={() => leads.fetchNextPage()}
				>
					{leads.isFetchingNextPage ? (
						<Loader2 className="size-4 animate-spin" />
					) : null}
					Carregar mais
				</Button>
			) : null}

			<LeadDialog
				lead={open}
				onClose={() => setOpen(null)}
				onDelete={async (lead) => {
					const ok = await confirm({
						title: "Excluir lead?",
						description:
							"Os dados deste contato serão apagados definitivamente. Use para atender pedidos de exclusão (LGPD).",
						confirmText: "Excluir lead",
						destructive: true,
					});
					if (ok) remove.mutate(lead.id);
				}}
			/>
		</div>
	);
}

function LeadDialog({
	lead,
	onClose,
	onDelete,
}: {
	lead: Lead | null;
	onClose: () => void;
	onDelete: (lead: Lead) => void;
}) {
	if (!lead) return <Dialog open={false} />;
	const entries = Object.entries(lead.data);
	const fields = entries.filter(([k]) => !/^(utm_|fbclid|gclid|tags$)/.test(k));
	const tracking = entries.filter(([k]) =>
		/^(utm_|fbclid|gclid|tags$)/.test(k),
	);
	const phoneKey = fields.find(([k, v]) => isPhoneKey(k) && v)?.[0];
	const digits = phoneKey ? lead.data[phoneKey].replace(/\D/g, "") : "";
	// número brasileiro sem DDI (DDD + número) ganha o 55
	const phone =
		digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
	const title =
		lead.data.nome ||
		lead.data.name ||
		lead.data.email ||
		lead.data.e_mail ||
		"Lead";
	return (
		<Dialog open onOpenChange={(v) => !v && onClose()}>
			<DialogContent
				className="sm:max-w-lg"
				// sem foco automático no primeiro botão (que é o "Excluir")
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{lead.formName} · {lead.pageName} · {dateTime(lead.createdAt)}
					</DialogDescription>
				</DialogHeader>
				<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
					{fields.map(([k, v]) => (
						<Row key={k} label={fieldLabel(k)} value={display(k, v)} />
					))}
				</dl>
				{tracking.length || lead.url ? (
					<div className="flex flex-col gap-2 rounded-lg border border-border bg-card/50 p-3">
						<span className="text-xs font-medium text-muted-foreground">
							Rastreamento
						</span>
						<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-xs">
							{tracking.map(([k, v]) => (
								<Row key={k} label={fieldLabel(k)} value={v} />
							))}
							{lead.url ? <Row label="Enviado em" value={lead.url} /> : null}
						</dl>
					</div>
				) : null}
				<div className="flex flex-wrap justify-between gap-2">
					<Button
						variant="ghost"
						className="text-muted-foreground hover:text-destructive"
						onClick={() => onDelete(lead)}
					>
						<Trash2 className="size-4" /> Excluir
					</Button>
					<div className="flex gap-2">
						{lead.url ? (
							<Button variant="outline" asChild>
								<a href={lead.url} target="_blank" rel="noreferrer">
									<ExternalLink className="size-4" /> Página
								</a>
							</Button>
						) : null}
						{phone ? (
							<Button asChild>
								<a
									href={`https://wa.me/${phone}`}
									target="_blank"
									rel="noreferrer"
								>
									<MessageCircle className="size-4" /> Chamar no WhatsApp
								</a>
							</Button>
						) : null}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<>
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="min-w-0 break-words">{value || "—"}</dd>
		</>
	);
}
