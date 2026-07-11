import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Cog,
  CreditCard,
  Mail,
  MessageSquare,
  Plug,
  Save,
  Sparkles,
  Webhook,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSettings, updateSettings, type IntegrationConfig } from "@/services/settingsService";

export const Route = createFileRoute("/_authenticated/admin/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações — Admin ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Provider = {
  key: string;
  name: string;
  category: "payment" | "email" | "messaging" | "analytics" | "webhook";
  icon: React.ComponentType<{ size?: number }>;
  description: string;
  fields: { key: string; label: string; placeholder?: string; secret?: boolean }[];
};

const PROVIDERS: Provider[] = [
  {
    key: "stripe",
    name: "Stripe",
    category: "payment",
    icon: CreditCard,
    description: "Cobrança recorrente das assinaturas dos profissionais.",
    fields: [
      { key: "publishable_key", label: "Publishable key", placeholder: "pk_live_…" },
      { key: "secret_key", label: "Secret key", placeholder: "sk_live_…", secret: true },
      { key: "webhook_secret", label: "Webhook secret", placeholder: "whsec_…", secret: true },
    ],
  },
  {
    key: "pagarme",
    name: "Pagar.me",
    category: "payment",
    icon: CreditCard,
    description: "Alternativa nacional para cartão, PIX e boleto.",
    fields: [
      { key: "api_key", label: "API key", secret: true },
      { key: "encryption_key", label: "Encryption key", secret: true },
    ],
  },
  {
    key: "resend",
    name: "Resend",
    category: "email",
    icon: Mail,
    description: "Envio transacional dos e-mails do sistema.",
    fields: [
      { key: "api_key", label: "API key", placeholder: "re_…", secret: true },
      { key: "from_email", label: "From (remetente)", placeholder: "avisos@proconecta.com" },
    ],
  },
  {
    key: "sendgrid",
    name: "SendGrid",
    category: "email",
    icon: Mail,
    description: "Provedor SMTP alternativo para grandes volumes.",
    fields: [
      { key: "api_key", label: "API key", secret: true },
      { key: "from_email", label: "From (remetente)" },
    ],
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business API",
    category: "messaging",
    icon: MessageSquare,
    description: "Notificações e chat via WhatsApp Cloud API.",
    fields: [
      { key: "phone_number_id", label: "Phone number ID" },
      { key: "access_token", label: "Access token", secret: true },
    ],
  },
  {
    key: "google_analytics",
    name: "Google Analytics 4",
    category: "analytics",
    icon: Sparkles,
    description: "Medição de tráfego e conversões no site público.",
    fields: [{ key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXX" }],
  },
  {
    key: "meta_pixel",
    name: "Meta Pixel",
    category: "analytics",
    icon: Sparkles,
    description: "Rastreamento para campanhas no Facebook e Instagram.",
    fields: [{ key: "pixel_id", label: "Pixel ID" }],
  },
  {
    key: "webhook_lead",
    name: "Webhook de leads",
    category: "webhook",
    icon: Webhook,
    description: "Envia novos leads para um endpoint externo (CRM próprio).",
    fields: [
      { key: "endpoint", label: "URL do endpoint", placeholder: "https://…" },
      { key: "secret", label: "Assinatura HMAC", secret: true },
    ],
  },
];

const CATEGORY_LABELS: Record<Provider["category"], string> = {
  payment: "Pagamentos",
  email: "E-mail",
  messaging: "Mensageria",
  analytics: "Analytics",
  webhook: "Webhooks",
};

function Page() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: getSettings,
  });
  const [editing, setEditing] = useState<Provider | null>(null);

  const integrations = data?.integrations ?? {};

  const saveM = useMutation({
    mutationFn: async (patch: Record<string, IntegrationConfig>) =>
      updateSettings({ integrations: { ...integrations, ...patch } }),
    onSuccess: () => {
      toast.success("Integração atualizada");
      qc.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const g: Record<Provider["category"], Provider[]> = {
      payment: [],
      email: [],
      messaging: [],
      analytics: [],
      webhook: [],
    };
    PROVIDERS.forEach((p) => g[p.category].push(p));
    return g;
  }, []);

  const enabledCount = Object.values(integrations).filter((i) => i?.enabled).length;

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-[oklch(0.93_0.014_258)] bg-gradient-to-br from-[oklch(0.98_0.012_258)] via-white to-[oklch(0.97_0.03_60)] p-6 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_24px_60px_-32px_oklch(0.51_0.245_262/18%)] sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15 backdrop-blur">
              <Plug size={12} /> Integrações
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Central de integrações
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Conecte gateways de pagamento, provedores de e-mail, canais de mensageria e ferramentas de analytics.
            </p>
          </div>
          <div className="flex gap-3">
            <Stat label="Provedores disponíveis" value={PROVIDERS.length} />
            <Stat label="Conectados" value={enabledCount} accent />
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(grouped) as Provider["category"][]).map((cat) => (
            <section key={cat}>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {grouped[cat].map((p) => {
                  const cfg = integrations[p.key];
                  const Icon = p.icon;
                  return (
                    <article
                      key={p.key}
                      className="group rounded-3xl border border-[oklch(0.93_0.014_258)] bg-card p-5 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%)] transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <header className="flex items-start justify-between">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                          <Icon size={18} />
                        </span>
                        {cfg?.enabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <Check size={12} /> Conectado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            Desconectado
                          </span>
                        )}
                      </header>
                      <h3 className="mt-3 font-display text-base font-bold text-foreground">{p.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <Switch
                          checked={!!cfg?.enabled}
                          onCheckedChange={(v) =>
                            saveM.mutate({ [p.key]: { ...cfg, enabled: v, config: cfg?.config ?? {} } })
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setEditing(p)}
                        >
                          <Cog size={12} className="mr-1.5" /> Configurar
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <ProviderDialog
          provider={editing}
          current={integrations[editing.key]}
          onClose={() => setEditing(null)}
          onSave={(cfg) => {
            saveM.mutate({ [editing.key]: cfg });
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-center ring-1 backdrop-blur ${
        accent
          ? "bg-primary/95 text-white ring-primary/40 shadow-lg shadow-primary/25"
          : "bg-white/80 text-foreground ring-[oklch(0.93_0.014_258)]"
      }`}
    >
      <div className="font-display text-2xl font-extrabold leading-none">{value}</div>
      <div className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${accent ? "text-white/80" : "text-muted-foreground"}`}>
        {label}
      </div>
    </div>
  );
}

function ProviderDialog({
  provider,
  current,
  onClose,
  onSave,
}: {
  provider: Provider;
  current: IntegrationConfig | undefined;
  onClose: () => void;
  onSave: (cfg: IntegrationConfig) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(!!current?.enabled);

  useEffect(() => {
    setValues(current?.config ?? {});
    setEnabled(!!current?.enabled);
  }, [provider.key, current]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Configurar {provider.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{provider.description}</p>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-[oklch(0.93_0.014_258)] bg-muted/40 p-3">
          <div>
            <div className="text-sm font-semibold">Ativar integração</div>
            <div className="text-[11px] text-muted-foreground">
              Habilite após preencher e validar as credenciais.
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="mt-4 space-y-3">
          {provider.fields.map((f) => (
            <div key={f.key}>
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}
              </Label>
              <Input
                type={f.secret ? "password" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1.5"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            <X size={14} className="mr-1.5" /> Cancelar
          </Button>
          <Button
            onClick={() => onSave({ enabled, config: values })}
            className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Save size={14} className="mr-1.5" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
