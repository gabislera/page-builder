import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";
import { APP_NAME } from "#/lib/brand";

/** Better Auth error codes in Portuguese (the library answers in English). */
const AUTH_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com esse e-mail.",
  INVALID_EMAIL: "Esse e-mail não parece válido.",
  INVALID_PASSWORD: "Senha inválida.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "A senha é longa demais.",
  FAILED_TO_CREATE_USER: "Não foi possível criar a conta. Tente novamente.",
};

function authErrorMessage(error: { code?: string; status?: number }) {
  if (error.status === 429) return "Muitas tentativas. Espere um pouco e tente de novo.";
  return (error.code && AUTH_ERRORS[error.code]) || "Não foi possível continuar. Tente novamente.";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setError(authErrorMessage(res.error));
      return;
    }
    navigate({ to: "/projects" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-editor-bg p-6">
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border bg-card p-8 shadow-xl"
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-widest text-primary uppercase">{APP_NAME}</span>
          <h1 className="text-xl font-semibold">{mode === "signup" ? "Criar conta" : "Entrar"}</h1>
        </div>
        {mode === "signup" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "signup" ? "Criar conta" : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>
              Já tem conta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </>
          ) : (
            <>
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Criar conta
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
