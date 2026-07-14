import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Palette,
  Save,
  Settings2,
  Sparkles,
  Upload,
  User,
  X,
  LayoutTemplate,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSettings, updateSettings, type UpdateSettingsInput, type FooterColumn, type FooterConfig } from "@/services/settingsService";
import { uploadAdminMedia } from "@/services/adminMediaService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";


export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => getSettings(true),
  });

  const updateM = useMutation({
    mutationFn: (input: UpdateSettingsInput) => updateSettings(input),
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-[oklch(0.93_0.014_258)] bg-gradient-to-br from-[oklch(0.98_0.012_258)] via-white to-[oklch(0.97_0.03_60)] p-6 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_24px_60px_-32px_oklch(0.51_0.245_262/18%)] sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15 backdrop-blur">
            <Sparkles size={12} /> Configurações do sistema
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Configurações
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gerencie identidade visual, dados da empresa, preferências operacionais e seu perfil administrativo.
          </p>
        </div>
      </section>

      {isLoading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : (
        <Tabs defaultValue="brand" className="space-y-6">
          <TabsList className="h-auto flex-wrap gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-[oklch(0.93_0.014_258)]">
            <TabsTrigger value="brand" className="gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette size={15} /> Marca
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 size={15} /> Empresa
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutTemplate size={15} /> Rodapé
            </TabsTrigger>
            <TabsTrigger value="prefs" className="gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings2 size={15} /> Preferências
            </TabsTrigger>
            <TabsTrigger value="me" className="gap-2 rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User size={15} /> Meu perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brand">
            <BrandTab settings={data} save={(patch) => updateM.mutate(patch)} saving={updateM.isPending} />
          </TabsContent>
          <TabsContent value="company">
            <CompanyTab settings={data} save={(patch) => updateM.mutate(patch)} saving={updateM.isPending} />
          </TabsContent>
          <TabsContent value="footer">
            <FooterTab settings={data} save={(patch) => updateM.mutate(patch)} saving={updateM.isPending} />
          </TabsContent>
          <TabsContent value="prefs">
            <PrefsTab settings={data} save={(patch) => updateM.mutate(patch)} saving={updateM.isPending} />
          </TabsContent>
          <TabsContent value="me">
            <MyProfileTab />
          </TabsContent>
        </Tabs>

      )}
    </>
  );
}

// ------------------------- BRAND -------------------------

function BrandTab({
  settings,
  save,
  saving,
}: {
  settings: Awaited<ReturnType<typeof getSettings>>;
  save: (patch: UpdateSettingsInput) => void;
  saving: boolean;
}) {
  const [brandName, setBrandName] = useState(settings.brand_name);
  const [tagline, setTagline] = useState(settings.tagline ?? "");
  const [primary, setPrimary] = useState(settings.primary_color ?? "#0759F8");
  const [accent, setAccent] = useState(settings.accent_color ?? "#FF642E");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <Card title="Identidade" icon={<Sparkles size={16} />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome comercial">
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </Field>
            <Field label="Tagline">
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ex.: Resolva sem complicação" />
            </Field>
            <Field label="Cor primária">
              <ColorField value={primary} onChange={setPrimary} />
            </Field>
            <Field label="Cor de destaque">
              <ColorField value={accent} onChange={setAccent} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() =>
                save({
                  brand_name: brandName,
                  tagline: tagline || null,
                  primary_color: primary,
                  accent_color: accent,
                })
              }
              disabled={saving}
              className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              <Save size={14} className="mr-1.5" /> Salvar identidade
            </Button>
          </div>
        </Card>

        <Card title="Logos e favicon" icon={<ImageIcon size={16} />}>
          <div className="grid gap-4 sm:grid-cols-3">
            <LogoUploader
              label="Logo (tema claro)"
              currentUrl={settings.logo_light_url}
              onChange={(id) => save({ logo_light_media_id: id })}
              onRemove={() => save({ logo_light_media_id: null })}
              aspect="rect"
            />
            <LogoUploader
              label="Logo (tema escuro)"
              currentUrl={settings.logo_dark_url}
              dark
              onChange={(id) => save({ logo_dark_media_id: id })}
              onRemove={() => save({ logo_dark_media_id: null })}
              aspect="rect"
            />
            <LogoUploader
              label="Favicon"
              currentUrl={settings.favicon_url}
              onChange={(id) => save({ favicon_media_id: id })}
              onRemove={() => save({ favicon_media_id: null })}
              aspect="square"
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Logo horizontal ideal 320×80px (PNG ou SVG). Favicon quadrado 512×512px. As alterações refletem no header público imediatamente.
          </p>
        </Card>
      </div>

      {/* Preview */}
      <aside className="space-y-3">
        <Card title="Preview" icon={<Globe2 size={16} />}>
          <div className="rounded-2xl border border-[oklch(0.93_0.014_258)] bg-white p-4">
            <div className="flex items-center gap-2">
              {settings.logo_light_url ? (
                <img src={settings.logo_light_url} alt={brandName} className="h-10 w-10 rounded-xl object-contain ring-1 ring-black/5" />
              ) : (
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl text-white"
                  style={{ background: primary }}
                >
                  <Sparkles size={16} />
                </span>
              )}
              <div className="leading-tight">
                <div className="font-display text-base font-extrabold text-foreground">{brandName || "Marca"}</div>
                <div className="text-[10px] text-muted-foreground">{tagline || "—"}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-[oklch(0.15_0.03_260)] p-4">
            <div className="flex items-center gap-2">
              {settings.logo_dark_url ? (
                <img src={settings.logo_dark_url} alt={brandName} className="h-10 w-10 rounded-xl object-contain" />
              ) : (
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl text-white"
                  style={{ background: primary }}
                >
                  <Sparkles size={16} />
                </span>
              )}
              <div className="leading-tight text-white">
                <div className="font-display text-base font-extrabold">{brandName || "Marca"}</div>
                <div className="text-[10px] text-white/60">{tagline || "—"}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ background: primary }}>
              Primária
            </span>
            <span className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ background: accent }}>
              Destaque
            </span>
          </div>
        </Card>
      </aside>
    </div>
  );
}

// ------------------------- COMPANY -------------------------

function CompanyTab({
  settings,
  save,
  saving,
}: {
  settings: Awaited<ReturnType<typeof getSettings>>;
  save: (patch: UpdateSettingsInput) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    legal_name: settings.legal_name ?? "",
    cnpj: settings.cnpj ?? "",
    address: settings.address ?? "",
    support_email: settings.support_email ?? "",
    support_phone: settings.support_phone ?? "",
    whatsapp: settings.whatsapp ?? "",
    social_instagram: settings.social_instagram ?? "",
    social_facebook: settings.social_facebook ?? "",
    social_linkedin: settings.social_linkedin ?? "",
    social_youtube: settings.social_youtube ?? "",
  });
  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-5">
      <Card title="Dados fiscais" icon={<Building2 size={16} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Razão social">
            <Input value={form.legal_name} onChange={(e) => upd("legal_name", e.target.value)} />
          </Field>
          <Field label="CNPJ">
            <Input value={form.cnpj} onChange={(e) => upd("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Textarea rows={2} value={form.address} onChange={(e) => upd("address", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Contatos oficiais" icon={<Globe2 size={16} />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="E-mail de suporte">
            <Input value={form.support_email} onChange={(e) => upd("support_email", e.target.value)} placeholder="ajuda@proconecta.com" />
          </Field>
          <Field label="Telefone">
            <Input value={form.support_phone} onChange={(e) => upd("support_phone", e.target.value)} placeholder="(11) 3000-0000" />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => upd("whatsapp", e.target.value)} placeholder="(11) 90000-0000" />
          </Field>
        </div>
      </Card>

      <Card title="Redes sociais" icon={<Sparkles size={16} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram">
            <Input value={form.social_instagram} onChange={(e) => upd("social_instagram", e.target.value)} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="Facebook">
            <Input value={form.social_facebook} onChange={(e) => upd("social_facebook", e.target.value)} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="LinkedIn">
            <Input value={form.social_linkedin} onChange={(e) => upd("social_linkedin", e.target.value)} placeholder="https://linkedin.com/company/…" />
          </Field>
          <Field label="YouTube">
            <Input value={form.social_youtube} onChange={(e) => upd("social_youtube", e.target.value)} placeholder="https://youtube.com/@…" />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            save({
              legal_name: form.legal_name || null,
              cnpj: form.cnpj || null,
              address: form.address || null,
              support_email: form.support_email || null,
              support_phone: form.support_phone || null,
              whatsapp: form.whatsapp || null,
              social_instagram: form.social_instagram || null,
              social_facebook: form.social_facebook || null,
              social_linkedin: form.social_linkedin || null,
              social_youtube: form.social_youtube || null,
            })
          }
          disabled={saving}
          className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
        >
          <Save size={14} className="mr-1.5" /> Salvar dados
        </Button>
      </div>
    </div>
  );
}

// ------------------------- PREFS -------------------------

function PrefsTab({
  settings,
  save,
  saving,
}: {
  settings: Awaited<ReturnType<typeof getSettings>>;
  save: (patch: UpdateSettingsInput) => void;
  saving: boolean;
}) {
  const [locale, setLocale] = useState(settings.default_locale ?? "pt-BR");
  const [tz, setTz] = useState(settings.default_timezone ?? "America/Sao_Paulo");
  const [currency, setCurrency] = useState(settings.default_currency ?? "BRL");
  const [df, setDf] = useState(settings.date_format ?? "dd/MM/yyyy");

  return (
    <Card title="Preferências operacionais" icon={<Settings2 size={16} />}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Idioma padrão">
          <Input value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="pt-BR" />
        </Field>
        <Field label="Fuso horário">
          <Input value={tz} onChange={(e) => setTz(e.target.value)} placeholder="America/Sao_Paulo" />
        </Field>
        <Field label="Moeda padrão">
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="BRL" />
        </Field>
        <Field label="Formato de data">
          <Input value={df} onChange={(e) => setDf(e.target.value)} placeholder="dd/MM/yyyy" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() =>
            save({
              default_locale: locale,
              default_timezone: tz,
              default_currency: currency,
              date_format: df,
            })
          }
          disabled={saving}
          className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
        >
          <Save size={14} className="mr-1.5" /> Salvar preferências
        </Button>
      </div>
    </Card>
  );
}

// ------------------------- MY PROFILE -------------------------

function MyProfileTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["my-admin-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.full_name ?? "");
      setPhone(data.phone ?? "");
    }
  }, [data]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, phone: phone || null })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["my-admin-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePass = useMutation({
    mutationFn: async () => {
      if (newPass.length < 6) throw new Error("Mínimo 6 caracteres");
      if (newPass !== newPass2) throw new Error("Senhas não conferem");
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha alterada");
      setNewPass("");
      setNewPass2("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Dados pessoais" icon={<User size={16} />}>
        <div className="grid gap-4">
          <Field label="Nome completo">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input value={data?.email ?? user?.email ?? ""} disabled className="bg-muted" />
          </Field>
          <Field label="Telefone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => saveProfile.mutate()}
            disabled={saveProfile.isPending}
            className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Save size={14} className="mr-1.5" /> Salvar
          </Button>
        </div>
      </Card>

      <Card title="Segurança" icon={<KeyRound size={16} />}>
        <div className="grid gap-4">
          <Field label="Nova senha">
            <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </Field>
          <Field label="Confirme a nova senha">
            <Input type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => changePass.mutate()}
            disabled={changePass.isPending || !newPass}
            className="rounded-xl bg-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <KeyRound size={14} className="mr-1.5" /> Alterar senha
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ------------------------- UI helpers -------------------------

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[oklch(0.93_0.014_258)] bg-card p-5 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%)] sm:p-6">
      <header className="mb-4 flex items-center gap-2">
        {icon && <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>}
        <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-[oklch(0.93_0.014_258)] bg-white p-1"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="uppercase" />
    </div>
  );
}

function LogoUploader({
  label,
  currentUrl,
  onChange,
  onRemove,
  dark,
  aspect,
}: {
  label: string;
  currentUrl: string | null;
  onChange: (mediaId: string) => void;
  onRemove: () => void;
  dark?: boolean;
  aspect: "square" | "rect";
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Máximo 3MB");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadAdminMedia(file, "general");
      onChange(res.mediaId);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div
        className={`mt-1.5 grid ${aspect === "square" ? "aspect-square" : "aspect-[16/8]"} place-items-center overflow-hidden rounded-2xl border border-dashed border-[oklch(0.9_0.02_258)] ${dark ? "bg-[oklch(0.15_0.03_260)]" : "bg-[oklch(0.98_0.008_258)]"}`}
      >
        {currentUrl ? (
          <div className="relative h-full w-full">
            <img src={currentUrl} alt={label} className="h-full w-full object-contain p-2" />
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remover"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className={`grid place-items-center gap-1 ${dark ? "text-white/40" : "text-primary/40"}`}>
            <ImageIcon size={28} />
            <span className="text-[11px]">Sem imagem</span>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => ref.current?.click()}
        className="mt-2 w-full rounded-xl"
      >
        <Upload size={12} className="mr-1.5" />
        {uploading ? "Enviando…" : currentUrl ? "Trocar" : "Enviar"}
      </Button>
    </div>
  );
}
