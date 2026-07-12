import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, Save, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getSettings, updateSettings, type EmailTemplate } from "@/services/settingsService";

export const Route = createFileRoute("/_authenticated/admin/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type TplDef = {
  key: string;
  label: string;
  description: string;
  variables: string[];
  defaultSubject: string;
  defaultBody: string;
};

const TEMPLATES: TplDef[] = [
  {
    key: "welcome_client",
    label: "Boas-vindas · Cliente",
    description: "Enviado quando um cliente cria a conta.",
    variables: ["{{name}}", "{{brand}}"],
    defaultSubject: "Bem-vindo à {{brand}}, {{name}}!",
    defaultBody:
      "<p>Olá {{name}},</p><p>Sua conta foi criada com sucesso. Encontre profissionais verificados perto de você.</p>",
  },
  {
    key: "welcome_pro",
    label: "Boas-vindas · Profissional",
    description: "Enviado quando um profissional se cadastra.",
    variables: ["{{name}}", "{{brand}}"],
    defaultSubject: "{{name}}, sua conta profissional foi criada",
    defaultBody:
      "<p>Olá {{name}},</p><p>Complete seu perfil e envie seus documentos para começar a receber leads.</p>",
  },
  {
    key: "new_quote",
    label: "Nova solicitação de orçamento",
    description: "Notifica o profissional sobre um novo lead compatível.",
    variables: ["{{pro_name}}", "{{quote_title}}", "{{link}}"],
    defaultSubject: "Nova solicitação: {{quote_title}}",
    defaultBody:
      "<p>Olá {{pro_name}},</p><p>Você tem um novo orçamento para responder: <a href='{{link}}'>{{quote_title}}</a>.</p>",
  },
  {
    key: "proposal_received",
    label: "Nova proposta recebida",
    description: "Notifica o cliente que recebeu uma proposta.",
    variables: ["{{client_name}}", "{{pro_name}}", "{{link}}"],
    defaultSubject: "{{pro_name}} enviou uma proposta",
    defaultBody:
      "<p>Olá {{client_name}},</p><p>{{pro_name}} enviou uma proposta para seu pedido. <a href='{{link}}'>Ver proposta</a>.</p>",
  },
  {
    key: "proposal_accepted",
    label: "Proposta aceita",
    description: "Confirmação enviada ao profissional quando o cliente aceita.",
    variables: ["{{pro_name}}", "{{quote_title}}"],
    defaultSubject: "Parabéns! Sua proposta foi aceita",
    defaultBody:
      "<p>Olá {{pro_name}},</p><p>Sua proposta para \"{{quote_title}}\" foi aceita. Entre em contato pelo chat.</p>",
  },
  {
    key: "review_request",
    label: "Solicitação de avaliação",
    description: "Enviado ao cliente após o serviço ser marcado como concluído.",
    variables: ["{{client_name}}", "{{pro_name}}", "{{link}}"],
    defaultSubject: "Como foi seu serviço com {{pro_name}}?",
    defaultBody:
      "<p>Olá {{client_name}},</p><p>Sua avaliação ajuda outros clientes. <a href='{{link}}'>Deixar avaliação</a>.</p>",
  },
  {
    key: "password_reset",
    label: "Recuperação de senha",
    description: "Enviado quando o usuário solicita recuperação de senha.",
    variables: ["{{name}}", "{{link}}"],
    defaultSubject: "Redefinir sua senha",
    defaultBody:
      "<p>Olá {{name}},</p><p>Clique no link para redefinir sua senha: <a href='{{link}}'>{{link}}</a>. O link expira em 1 hora.</p>",
  },
];

function Page() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => getSettings(true),
  });
  const templates = data?.email_templates ?? {};
  const [activeKey, setActiveKey] = useState(TEMPLATES[0].key);
  const active = useMemo(() => TEMPLATES.find((t) => t.key === activeKey)!, [activeKey]);
  const current: EmailTemplate = templates[activeKey] ?? {
    subject: active.defaultSubject,
    body_html: active.defaultBody,
    enabled: true,
  };

  const [subject, setSubject] = useState(current.subject);
  const [body, setBody] = useState(current.body_html);
  const [enabled, setEnabled] = useState(current.enabled);

  useEffect(() => {
    const t: EmailTemplate = templates[activeKey] ?? {
      subject: active.defaultSubject,
      body_html: active.defaultBody,
      enabled: true,
    };
    setSubject(t.subject);
    setBody(t.body_html);
    setEnabled(t.enabled);
  }, [activeKey, templates, active]);

  const saveM = useMutation({
    mutationFn: async () =>
      updateSettings({
        email_templates: { ...templates, [activeKey]: { subject, body_html: body, enabled } },
      }),
    onSuccess: () => {
      toast.success("Template salvo");
      qc.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const configured = Object.keys(templates).length;

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-[oklch(0.93_0.014_258)] bg-gradient-to-br from-[oklch(0.98_0.012_258)] via-white to-[oklch(0.97_0.03_60)] p-6 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_24px_60px_-32px_oklch(0.51_0.245_262/18%)] sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15 backdrop-blur">
              <Mail size={12} /> Templates de comunicação
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Templates de e-mail
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Personalize assunto e corpo dos e-mails transacionais e de notificação enviados pela plataforma.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/80 px-4 py-3 text-center ring-1 ring-[oklch(0.93_0.014_258)]">
              <div className="font-display text-2xl font-extrabold leading-none">{TEMPLATES.length}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Disponíveis</div>
            </div>
            <div className="rounded-2xl bg-primary/95 px-4 py-3 text-center text-white shadow-lg shadow-primary/25 ring-1 ring-primary/40">
              <div className="font-display text-2xl font-extrabold leading-none">{configured}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">Personalizados</div>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-[oklch(0.93_0.014_258)] bg-card p-3 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%)]">
            <nav className="space-y-1">
              {TEMPLATES.map((t) => {
                const active = t.key === activeKey;
                const isCustom = !!templates[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveKey(t.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-xl ${
                        active ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Mail size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{t.label}</div>
                      <div className={`truncate text-[10px] ${active ? "text-white/70" : "text-muted-foreground"}`}>
                        {isCustom ? "Personalizado" : "Padrão"}
                      </div>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="rounded-3xl border border-[oklch(0.93_0.014_258)] bg-card p-5 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%)] sm:p-6">
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">{active.label}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{active.description}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 ring-1 ring-[oklch(0.93_0.014_258)]">
                <span className="text-xs font-semibold text-foreground">Ativo</span>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </header>

            <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-2xl bg-muted/40 p-3">
              <Sparkles size={12} className="text-primary" />
              <span className="mr-1 text-[11px] font-semibold text-muted-foreground">Variáveis:</span>
              {active.variables.map((v) => (
                <code
                  key={v}
                  className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-mono text-primary ring-1 ring-primary/15"
                >
                  {v}
                </code>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Assunto
                </Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Corpo (HTML)
                </Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="mt-1.5 font-mono text-xs"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[oklch(0.93_0.014_258)] bg-white p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Preview
              </div>
              <div className="mb-2 border-b pb-2 text-sm font-semibold">{subject}</div>
              <div
                className="prose prose-sm max-w-none text-sm text-foreground"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSubject(active.defaultSubject);
                  setBody(active.defaultBody);
                  setEnabled(true);
                }}
              >
                <Zap size={14} className="mr-1.5" /> Restaurar padrão
              </Button>
              <Button
                onClick={() => saveM.mutate()}
                disabled={saveM.isPending}
                className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
              >
                <Save size={14} className="mr-1.5" /> Salvar template
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
