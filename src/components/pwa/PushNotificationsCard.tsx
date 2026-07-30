import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, Laptop, Loader2, Send, Smartphone, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import {
  getPreferences,
  savePreferences,
  sendTestPush,
  type NotificationPreferences,
} from "@/lib/push/pushClient";

const PREF_ITEMS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "push_messages", label: "Mensagens do chat" },
  { key: "push_quotes", label: "Pedidos de orçamento" },
  { key: "push_proposals", label: "Propostas" },
  { key: "push_reviews", label: "Avaliações" },
  { key: "push_subscription", label: "Assinatura e vencimentos" },
  { key: "push_moderation", label: "Moderação e aprovações" },
  { key: "push_system", label: "Avisos do sistema" },
];

export function PushNotificationsCard({ showPreferences = true }: { showPreferences?: boolean }) {
  const { user } = useAuth();
  const push = usePushNotifications();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [testing, setTesting] = useState(false);

  useQuery({
    queryKey: ["notif-prefs", user?.id],
    enabled: Boolean(user?.id) && showPreferences,
    queryFn: async () => {
      const data = await getPreferences(user!.id);
      setPrefs(data);
      return data;
    },
  });

  const togglePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.id || !prefs) return;
    const next = { ...prefs, [key]: value } as NotificationPreferences;
    setPrefs(next);
    try {
      await savePreferences(user.id, { [key]: value });
    } catch (e) {
      toast.error((e as Error).message);
      setPrefs(prefs);
    }
  };

  const saveQuiet = async (patch: Partial<NotificationPreferences>) => {
    if (!user?.id || !prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, ...patch } as NotificationPreferences);
    try {
      await savePreferences(user.id, patch);
    } catch (e) {
      toast.error((e as Error).message);
      setPrefs(previous);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await sendTestPush();
      toast.success(
        result.sent ? `Push de teste enviado para ${result.sent} dispositivo(s).` : "Nenhum dispositivo ativo encontrado.",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card p-4 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-extrabold text-foreground">Notificações no dispositivo</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Receba avisos de mensagens, orçamentos e propostas mesmo com o site fechado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {push.subscribedHere ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={push.disable} disabled={push.working}>
              Desativar neste aparelho
            </Button>
          ) : (
            <Button
              size="sm"
              className="rounded-full"
              onClick={push.enable}
              disabled={push.working || !push.supported || push.permission === "denied" || !user}
            >
              {push.working ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />} Ativar notificações
            </Button>
          )}
          <Button size="sm" variant="outline" className="rounded-full" onClick={handleTest} disabled={testing || !user}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar teste
          </Button>
        </div>
      </div>

      {!push.supported && (
        <Alert>Este navegador não suporta notificações push. Use Chrome, Edge, Firefox ou Safari atualizado.</Alert>
      )}
      {push.needsInstall && (
        <Alert>
          No iPhone/iPad é necessário instalar o aplicativo na tela de início antes de ativar as notificações.
        </Alert>
      )}
      {push.permission === "denied" && (
        <Alert>
          As notificações estão bloqueadas nas configurações do navegador para este site. Libere a permissão e tente
          novamente.
        </Alert>
      )}
      {push.error && <Alert>{push.error}</Alert>}

      <div className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Aparelhos registrados</h3>
        {push.loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>
        ) : push.devices.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum aparelho registrado ainda.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {push.devices.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    {d.platform === "Android" || d.platform === "iOS" ? <Smartphone size={16} /> : <Laptop size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{d.device_label ?? "Aparelho"}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.status === "expired" ? "Expirado · reative neste aparelho" : "Ativo"}
                      {d.last_used_at ? ` · último envio ${new Date(d.last_used_at).toLocaleDateString("pt-BR")}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => push.removeDevice(d.id)}
                  className="inline-flex items-center gap-1 self-start rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive sm:self-auto"
                >
                  <Trash2 size={12} /> Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPreferences && prefs && (
        <div className="mt-6 border-t border-border/60 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">O que você quer receber</h3>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-border/60 bg-background p-3">
            <Label htmlFor="push_enabled" className="text-sm font-semibold">
              Notificações push
            </Label>
            <Switch
              id="push_enabled"
              checked={prefs.push_enabled}
              onCheckedChange={(v) => togglePref("push_enabled", v)}
            />
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PREF_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-background p-3"
              >
                <Label htmlFor={item.key} className="text-sm">
                  {item.label}
                </Label>
                <Switch
                  id={item.key}
                  disabled={!prefs.push_enabled}
                  checked={Boolean(prefs[item.key])}
                  onCheckedChange={(v) => togglePref(item.key, v)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="quiet_hours" className="flex items-center gap-2 text-sm font-semibold">
                  <Moon size={14} className="text-primary" /> Horário silencioso
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nesse período só avisos urgentes chegam no celular (horário de Brasília).
                </p>
              </div>
              <Switch
                id="quiet_hours"
                checked={prefs.quiet_hours_start !== null && prefs.quiet_hours_end !== null}
                onCheckedChange={(v) =>
                  saveQuiet(
                    v
                      ? { quiet_hours_start: 22, quiet_hours_end: 7 }
                      : { quiet_hours_start: null, quiet_hours_end: null },
                  )
                }
              />
            </div>
            {prefs.quiet_hours_start !== null && prefs.quiet_hours_end !== null && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <HourSelect
                  label="Início"
                  value={prefs.quiet_hours_start}
                  onChange={(h) => saveQuiet({ quiet_hours_start: h })}
                />
                <HourSelect
                  label="Fim"
                  value={prefs.quiet_hours_end}
                  onChange={(h) => saveQuiet({ quiet_hours_end: h })}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-xl border border-orange/30 bg-orange/5 p-3 text-xs text-foreground">
      <TriangleAlert size={14} className="mt-0.5 shrink-0 text-orange" />
      <span>{children}</span>
    </p>
  );
}
