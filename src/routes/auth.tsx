import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Briefcase, User as UserIcon, Wrench } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  role: z.enum(["cliente", "profissional"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — ProConecta" },
      { name: "description", content: "Acesse sua conta ProConecta ou cadastre-se como cliente ou profissional." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [role, setRole] = useState<"cliente" | "profissional">(search.role ?? "cliente");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: (search.redirect as "/painel") || "/painel", replace: true });
    }
  }, [loading, user, navigate, search.redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/painel`,
            data: { full_name: fullName, phone, role },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail se a confirmação estiver ativada.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível processar sua solicitação.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <div className="container-page py-12 lg:py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <Wrench size={14} /> ProConecta
            </div>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-foreground">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Conecte-se com profissionais verificados perto de você ou receba pedidos de orçamento na sua região.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-primary" /> Profissionais avaliados por clientes reais</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-primary" /> Orçamentos rápidos, sem compromisso</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-primary" /> Atendimento em todo o Brasil</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:p-8">
            <div className="mb-6 flex gap-2 rounded-xl bg-secondary p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quero me cadastrar como</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("cliente")}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm transition ${role === "cliente" ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <UserIcon size={18} className="text-primary" />
                        <div>
                          <div className="font-semibold text-foreground">Cliente</div>
                          <div className="text-xs text-muted-foreground">Preciso de serviços</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("profissional")}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm transition ${role === "profissional" ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <Briefcase size={18} className="text-primary" />
                        <div>
                          <div className="font-semibold text-foreground">Profissional</div>
                          <div className="text-xs text-muted-foreground">Ofereço serviços</div>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>

              <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl text-sm font-semibold">
                {submitting ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
              </Button>

              {mode === "login" && (
                <div className="text-center text-sm">
                  <Link to="/recuperar-senha" className="text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Ao continuar, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </form>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
