import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, cities } from "@/data/categories";
import { submitQuoteRequest } from "@/services/mockApi";
import { submitQuoteToDb } from "@/services/clientService";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/pedir-orcamento")({
  validateSearch: (search: Record<string, unknown>) => ({
    profissional: typeof search.profissional === "string" ? search.profissional : undefined,
    categoria: typeof search.categoria === "string" ? search.categoria : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pedir orçamento grátis | ProConecta" },
      {
        name: "description",
        content: "Descreva o que você precisa e receba até 5 orçamentos de profissionais avaliados. Grátis e sem compromisso.",
      },
    ],
  }),
  component: PedirOrcamentoPage,
});

const STEPS = ["Serviço", "Detalhes", "Local e prazo", "Contato"];

interface FormState {
  categoria: string;
  servico: string;
  descricao: string;
  fotos: string;
  cidade: string;
  bairro: string;
  urgencia: string;
  nome: string;
  telefone: string;
  email: string;
}

const initialForm: FormState = {
  categoria: "",
  servico: "",
  descricao: "",
  fotos: "",
  cidade: "",
  bairro: "",
  urgencia: "esta-semana",
  nome: "",
  telefone: "",
  email: "",
};

function PedirOrcamentoPage() {
  const { categoria: categoriaParam } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    ...initialForm,
    categoria: categoriaParam ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [protocol, setProtocol] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => submitQuoteRequest(form as unknown as Record<string, unknown>),
    onSuccess: (res) => setProtocol(res.protocol),
  });

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (step === 0) {
      if (!form.categoria) next.categoria = "Escolha uma categoria.";
      if (!form.servico.trim()) next.servico = "Descreva o serviço que você precisa.";
    }
    if (step === 1) {
      if (form.descricao.trim().length < 20)
        next.descricao = "Conte um pouco mais (mínimo de 20 caracteres) para receber orçamentos precisos.";
    }
    if (step === 2) {
      if (!form.cidade) next.cidade = "Informe a cidade.";
    }
    if (step === 3) {
      if (!form.nome.trim()) next.nome = "Informe seu nome.";
      if (!/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(form.telefone.replace(/\s/g, "")))
        next.telefone = "Informe um WhatsApp válido com DDD, ex.: (11) 98888-7777.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        next.email = "Informe um e-mail válido.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      mutation.mutate();
    }
  };

  if (protocol) {
    return (
      <SiteLayout>
        <div className="container-page flex justify-center py-16">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-card sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success">
              <PartyPopper size={30} aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-foreground">
              Pedido enviado com sucesso!
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Protocolo <strong className="text-foreground">{protocol}</strong>. Profissionais da
              região já foram notificados — você receberá até 5 orçamentos no seu WhatsApp e e-mail
              (simulação de demonstração).
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="h-12 rounded-xl px-6 font-semibold">
                <Link to="/painel/cliente">Acompanhar no painel</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl px-6 font-semibold">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container-page flex justify-center py-12">
        <div className="w-full max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Pedir orçamento grátis
          </h1>
          <p className="mt-2 text-muted-foreground">
            Leva menos de 2 minutos. Receba até 5 propostas de profissionais avaliados.
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="text-primary">
                Etapa {step + 1} de {STEPS.length}: {STEPS[step]}
              </span>
              <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
            </div>
            <Progress value={((step + 1) / STEPS.length) * 100} className="mt-2 h-2" />
          </div>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="q-categoria" className="font-semibold">Qual categoria de serviço?</Label>
                  <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
                    <SelectTrigger id="q-categoria" className="mt-2 h-12! w-full rounded-xl">
                      <SelectValue placeholder="Escolha a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoria && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.categoria}</p>}
                </div>
                <div>
                  <Label htmlFor="q-servico" className="font-semibold">O que você precisa exatamente?</Label>
                  <Input
                    id="q-servico"
                    value={form.servico}
                    onChange={(e) => set("servico", e.target.value)}
                    placeholder="Ex.: instalar 3 tomadas e 1 chuveiro elétrico"
                    className="mt-2 h-12 rounded-xl"
                  />
                  {errors.servico && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.servico}</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="q-descricao" className="font-semibold">Descreva com detalhes</Label>
                  <Textarea
                    id="q-descricao"
                    value={form.descricao}
                    onChange={(e) => set("descricao", e.target.value)}
                    placeholder="Quanto mais detalhes, melhores os orçamentos: tamanho do ambiente, materiais, estado atual..."
                    rows={6}
                    className="mt-2 rounded-xl"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">{form.descricao.trim().length} caracteres</p>
                  {errors.descricao && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.descricao}</p>}
                </div>
                <div>
                  <Label htmlFor="q-fotos" className="font-semibold">
                    Fotos (opcional)
                  </Label>
                  <Input
                    id="q-fotos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => set("fotos", e.target.files ? `${e.target.files.length} arquivo(s)` : "")}
                    className="mt-2 h-12 rounded-xl pt-2.5"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Demonstração: os arquivos não são enviados nesta versão.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="q-cidade" className="font-semibold">Cidade</Label>
                    <Select value={form.cidade} onValueChange={(v) => set("cidade", v)}>
                      <SelectTrigger id="q-cidade" className="mt-2 h-12! w-full rounded-xl">
                        <SelectValue placeholder="Escolha a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cidade && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.cidade}</p>}
                  </div>
                  <div>
                    <Label htmlFor="q-bairro" className="font-semibold">Bairro (opcional)</Label>
                    <Input
                      id="q-bairro"
                      value={form.bairro}
                      onChange={(e) => set("bairro", e.target.value)}
                      placeholder="Ex.: Pinheiros"
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>
                </div>
                <fieldset>
                  <legend className="text-sm font-semibold text-foreground">Quando você precisa?</legend>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {[
                      { value: "hoje", label: "É urgente — hoje" },
                      { value: "esta-semana", label: "Nesta semana" },
                      { value: "data", label: "Em uma data específica" },
                      { value: "sem-urgencia", label: "Sem urgência" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium transition-colors ${
                          form.urgencia === opt.value
                            ? "border-primary bg-secondary text-primary"
                            : "border-border bg-background text-foreground hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="urgencia"
                          value={opt.value}
                          checked={form.urgencia === opt.value}
                          onChange={() => set("urgencia", opt.value)}
                          className="sr-only"
                        />
                        <CheckCircle2
                          size={17}
                          className={form.urgencia === opt.value ? "text-primary" : "text-muted-foreground/40"}
                          aria-hidden="true"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="q-nome" className="font-semibold">Seu nome</Label>
                  <Input
                    id="q-nome"
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                    placeholder="Nome completo"
                    autoComplete="name"
                    className="mt-2 h-12 rounded-xl"
                  />
                  {errors.nome && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.nome}</p>}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="q-telefone" className="font-semibold">WhatsApp</Label>
                    <Input
                      id="q-telefone"
                      value={form.telefone}
                      onChange={(e) => set("telefone", e.target.value)}
                      placeholder="(11) 98888-7777"
                      inputMode="tel"
                      autoComplete="tel"
                      className="mt-2 h-12 rounded-xl"
                    />
                    {errors.telefone && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.telefone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="q-email" className="font-semibold">E-mail</Label>
                    <Input
                      id="q-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="voce@email.com"
                      autoComplete="email"
                      className="mt-2 h-12 rounded-xl"
                    />
                    {errors.email && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.email}</p>}
                  </div>
                </div>
                <p className="rounded-xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
                  Ao enviar, você concorda em ser contatado por até 5 profissionais sobre este
                  pedido. Sem spam, sem compromisso de contratação.
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0 || mutation.isPending}
                className="h-12 rounded-xl px-5 font-semibold"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Voltar
              </Button>
              <Button
                onClick={goNext}
                disabled={mutation.isPending}
                className={`h-12 rounded-xl px-7 font-semibold ${
                  step === STEPS.length - 1 ? "bg-orange text-orange-foreground hover:bg-orange/90" : ""
                }`}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : step === STEPS.length - 1 ? (
                  "Enviar pedido"
                ) : (
                  <>
                    Continuar
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
