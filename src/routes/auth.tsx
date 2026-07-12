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
import { useBrand } from "@/hooks/use-brand";
import {
  Briefcase,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  Star,
  BadgeCheck,
  ArrowRight,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import authHero from "@/assets/auth-hero.jpg";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  role: z.enum(["cliente", "profissional"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta" },
      {
        name: "description",
        content:
          "Acesse sua conta ou cadastre-se em minutos como cliente ou profissional verificado.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: brand } = useBrand();
  const brandName = brand?.brand_name ?? "";

  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [role, setRole] = useState<"cliente" | "profissional">(search.role ?? "cliente");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="relative overflow-hidden bg-background">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-orange/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="container-page py-10 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
            {/* LEFT — Editorial hero */}
            <aside className="relative hidden overflow-hidden rounded-[2rem] border border-border bg-navy shadow-float lg:block">
              <img
                src={authHero}
                alt="Profissional ProConecta verificado"
                className="absolute inset-0 h-full w-full object-cover opacity-90"
                width={1024}
                height={1536}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-orange/25 mix-blend-overlay" />

              {/* Top badge */}
              <div className="relative z-10 flex items-start justify-between p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  <Sparkles size={14} className="text-orange" />
                  ProConecta Premium
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  <ShieldCheck size={14} className="text-emerald-300" />
                  100% verificados
                </div>
              </div>

              {/* Headline */}
              <div className="relative z-10 flex h-full flex-col justify-end p-8 lg:p-10">
                <p className="text-hand text-3xl text-orange">Conexões que constroem</p>
                <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.05] text-white xl:text-5xl">
                  Encontre o profissional{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">certo</span>
                    <span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-full bg-orange/60" />
                  </span>
                  <br />
                  para cada projeto.
                </h1>
                <p className="mt-4 max-w-md text-base text-white/80">
                  Mais de 250 mil brasileiros usam a ProConecta para receber orçamentos rápidos com quem
                  entende do assunto.
                </p>

                {/* Floating stat card */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-1 text-rating">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} size={14} className="fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold text-white">4.9/5</p>
                    <p className="text-xs text-white/70">Avaliação média</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <div className="inline-flex items-center gap-1.5 text-emerald-300">
                      <BadgeCheck size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wide">Verificados</span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold text-white">+12 mil</p>
                    <p className="text-xs text-white/70">Profissionais ativos</p>
                  </div>
                </div>

                {/* Trust row */}
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                  <div className="flex -space-x-2">
                    {["#FF642E", "#0759F8", "#20B15A", "#FFB800"].map((c, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-navy"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-white/85">
                    <span className="font-semibold text-white">250.000+ clientes</span> confiam na ProConecta
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT — Form card */}
            <div className="relative">
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-float lg:p-10">
                {/* Mobile brand */}
                <div className="mb-6 flex items-center justify-between lg:hidden">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles size={14} /> ProConecta
                  </span>
                  <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary">
                    Voltar ao site
                  </Link>
                </div>

                {/* Segmented tabs */}
                <div className="mb-8 flex gap-1 rounded-2xl bg-secondary p-1.5">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      mode === "login"
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      mode === "signup"
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Criar conta
                  </button>
                </div>

                <div className="mb-7">
                  <h2 className="font-display text-3xl font-extrabold leading-tight text-foreground">
                    {mode === "login" ? (
                      <>
                        Bem-vindo <span className="text-hand text-4xl text-orange">de volta</span>
                      </>
                    ) : (
                      <>
                        Comece <span className="text-hand text-4xl text-orange">em minutos</span>
                      </>
                    )}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {mode === "login"
                      ? "Acesse seus orçamentos, mensagens e projetos favoritos."
                      : "Cadastre-se grátis e conecte-se aos melhores profissionais do Brasil."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <>
                      <div>
                        <Label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Eu quero
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRole("cliente")}
                            className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                              role === "cliente"
                                ? "border-primary bg-primary/5 shadow-card"
                                : "border-border hover:border-primary/40 hover:bg-secondary/50"
                            }`}
                          >
                            <div
                              className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                                role === "cliente" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                              }`}
                            >
                              <UserIcon size={18} />
                            </div>
                            <div className="text-sm font-bold text-foreground">Contratar</div>
                            <div className="text-xs text-muted-foreground">Preciso de um serviço</div>
                            {role === "cliente" && (
                              <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRole("profissional")}
                            className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                              role === "profissional"
                                ? "border-orange bg-orange/5 shadow-card"
                                : "border-border hover:border-orange/40 hover:bg-secondary/50"
                            }`}
                          >
                            <div
                              className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                                role === "profissional"
                                  ? "bg-orange text-orange-foreground"
                                  : "bg-secondary text-orange"
                              }`}
                            >
                              <Briefcase size={18} />
                            </div>
                            <div className="text-sm font-bold text-foreground">Trabalhar</div>
                            <div className="text-xs text-muted-foreground">Ofereço serviços</div>
                            {role === "profissional" && (
                              <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-orange" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold text-foreground">
                            Nome completo
                          </Label>
                          <div className="relative">
                            <UserIcon
                              size={16}
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                              id="fullName"
                              required
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Seu nome"
                              className="h-12 rounded-xl border-border bg-background pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-foreground">
                            Telefone
                          </Label>
                          <div className="relative">
                            <Phone
                              size={16}
                              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                              id="phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="(11) 99999-9999"
                              className="h-12 rounded-xl border-border bg-background pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-foreground">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="h-12 rounded-xl border-border bg-background pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                        Senha
                      </Label>
                      {mode === "login" && (
                        <Link
                          to="/recuperar-senha"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Esqueci minha senha
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="h-12 rounded-xl border-border bg-background pl-10 pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="group h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-card transition-all hover:brightness-110 hover:shadow-float"
                  >
                    {submitting ? (
                      "Enviando..."
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        {mode === "login" ? "Entrar na minha conta" : "Criar minha conta grátis"}
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {mode === "login" ? "Novo por aqui?" : "Já tem conta?"}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="h-12 w-full rounded-xl border-2 border-border bg-card text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
                  >
                    {mode === "login" ? "Criar conta grátis" : "Fazer login"}
                  </button>

                  <p className="pt-2 text-center text-xs leading-relaxed text-muted-foreground">
                    Ao continuar, você concorda com nossos{" "}
                    <Link to="/" className="font-semibold text-primary hover:underline">
                      termos de uso
                    </Link>{" "}
                    e{" "}
                    <Link to="/" className="font-semibold text-primary hover:underline">
                      política de privacidade
                    </Link>
                    .
                  </p>
                </form>
              </div>

              {/* Small trust row below card */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-success" /> Dados protegidos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck size={14} className="text-primary" /> Perfis verificados
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star size={14} className="text-rating fill-current" /> 4.9 de avaliação
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
