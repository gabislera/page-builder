/**
 * Confirmação do app, no lugar do window.confirm do navegador:
 *
 *   if (await confirm({ title: "Excluir página?", destructive: true })) ...
 *
 * O <ConfirmDialogHost /> fica montado uma vez na raiz.
 */
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { create } from "zustand";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";

export type ConfirmOptions = {
	title: string;
	description?: ReactNode;
	confirmText?: string;
	cancelText?: string;
	/** Ação que apaga algo: botão vermelho e ícone de alerta. */
	destructive?: boolean;
};

type Request = ConfirmOptions & { resolve: (ok: boolean) => void };

const useConfirmStore = create<{
	request: Request | null;
	open: boolean;
}>(() => ({ request: null, open: false }));

/** Abre a confirmação e resolve com true (confirmou) ou false. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
	return new Promise((resolve) => {
		// uma confirmação pendente é cancelada por uma nova
		useConfirmStore.getState().request?.resolve(false);
		useConfirmStore.setState({ request: { ...options, resolve }, open: true });
	});
}

function settle(ok: boolean) {
	const { request } = useConfirmStore.getState();
	request?.resolve(ok);
	// mantém o conteúdo durante a animação de saída
	useConfirmStore.setState({ open: false });
}

export function ConfirmDialogHost() {
	const request = useConfirmStore((s) => s.request);
	const open = useConfirmStore((s) => s.open);
	if (!request) return null;
	return (
		<AlertDialog open={open} onOpenChange={(v) => !v && settle(false)}>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					{request.destructive ? (
						<AlertDialogMedia className="bg-destructive/10 text-destructive">
							<AlertTriangle />
						</AlertDialogMedia>
					) : null}
					<AlertDialogTitle>{request.title}</AlertDialogTitle>
					{request.description ? (
						<AlertDialogDescription>
							{request.description}
						</AlertDialogDescription>
					) : null}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => settle(false)}>
						{request.cancelText ?? "Cancelar"}
					</AlertDialogCancel>
					<AlertDialogAction
						variant={request.destructive ? "destructive" : "default"}
						onClick={() => settle(true)}
					>
						{request.confirmText ?? "Confirmar"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
