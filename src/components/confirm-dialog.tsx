/**
 * App confirmation dialog, instead of the browser's window.confirm:
 *
 *   if (await confirm({ title: "Excluir página?", destructive: true })) ...
 *
 * Mount <ConfirmDialogHost /> once at the root.
 */
import { AlertTriangle } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
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
import { Input } from "#/components/ui/input";

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Destructive action: red button and alert icon. */
  destructive?: boolean;
  /** Enable the button only after this exact text is typed. */
  requireText?: string;
};

type Request = ConfirmOptions & { id: number; resolve: (ok: boolean) => void };
let nextId = 0;

const useConfirmStore = create<{
  request: Request | null;
  open: boolean;
}>(() => ({ request: null, open: false }));

/** Open the confirmation and resolve with true (confirmed) or false. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // a pending confirmation is cancelled by a new one
    useConfirmStore.getState().request?.resolve(false);
    useConfirmStore.setState({
      request: { ...options, id: ++nextId, resolve },
      open: true,
    });
  });
}

function settle(ok: boolean) {
  const { request } = useConfirmStore.getState();
  request?.resolve(ok);
  // keep content during the exit animation
  useConfirmStore.setState({ open: false });
}

export function ConfirmDialogHost() {
  const request = useConfirmStore((s) => s.request);
  const open = useConfirmStore((s) => s.open);
  if (!request) return null;
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && settle(false)}>
      {/* key: each new confirmation starts with an empty field */}
      <ConfirmContent key={request.id} request={request} />
    </AlertDialog>
  );
}

function ConfirmContent({ request }: { request: Request }) {
  const [typed, setTyped] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const blocked = Boolean(request.requireText) && typed.trim() !== request.requireText;
  return (
    <AlertDialogContent
      size="sm"
      // when text must be typed, focus the field (not "Cancelar")
      onOpenAutoFocus={(e) => {
        if (!request.requireText) return;
        e.preventDefault();
        input.current?.focus();
      }}
    >
      <AlertDialogHeader>
        {request.destructive ? (
          <AlertDialogMedia className="mb-1 size-auto bg-transparent text-destructive">
            <AlertTriangle className="size-7" />
          </AlertDialogMedia>
        ) : null}
        <AlertDialogTitle>{request.title}</AlertDialogTitle>
        {request.description ? <AlertDialogDescription>{request.description}</AlertDialogDescription> : null}
      </AlertDialogHeader>
      {request.requireText ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-text" className="text-xs text-muted-foreground">
            Digite <strong className="text-foreground">{request.requireText}</strong> para confirmar
          </label>
          <Input
            id="confirm-text"
            ref={input}
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
      ) : null}
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => settle(false)}>{request.cancelText ?? "Cancelar"}</AlertDialogCancel>
        <AlertDialogAction
          variant={request.destructive ? "destructive" : "default"}
          disabled={blocked}
          onClick={() => settle(true)}
        >
          {request.confirmText ?? "Confirmar"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
