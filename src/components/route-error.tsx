import { type ErrorComponentProps, Link, useRouter } from "@tanstack/react-router";
import { FileQuestion, Lock, TriangleAlert } from "lucide-react";
import { Button } from "#/components/ui/button";

/** Messages written for the user by the server; anything else stays generic (no internals on screen). */
const KNOWN = [/sem permissão/i, /não encontrad/i];

function Screen({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof Lock;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-editor-bg p-6 text-foreground">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <Icon className="size-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{text}</p>
        <div className="mt-2 flex gap-2">{children}</div>
      </div>
    </div>
  );
}

/** Default error screen: access denied, missing data, expired session, or unexpected failure. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const message = error instanceof Error ? error.message : String(error);

  if (message === "UNAUTHORIZED") {
    return (
      <Screen icon={Lock} title="Sua sessão expirou" text="Entre de novo para continuar de onde parou.">
        <Button asChild>
          <Link to="/login">Entrar</Link>
        </Button>
      </Screen>
    );
  }
  const known = KNOWN.some((re) => re.test(message));
  return (
    <Screen
      icon={known ? Lock : TriangleAlert}
      title={known ? message : "Algo deu errado"}
      text={
        known
          ? "Confira se você está na conta certa ou peça acesso a quem é dono do projeto."
          : "Não foi possível carregar esta tela. Tente de novo em instantes."
      }
    >
      <Button asChild variant="outline">
        <Link to="/projects">Ir para os projetos</Link>
      </Button>
      {known ? null : (
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Tentar de novo
        </Button>
      )}
    </Screen>
  );
}

export function RouteNotFound() {
  return (
    <Screen icon={FileQuestion} title="Página não encontrada" text="O endereço pode ter mudado ou não existe mais.">
      <Button asChild variant="outline">
        <Link to="/projects">Ir para os projetos</Link>
      </Button>
    </Screen>
  );
}
