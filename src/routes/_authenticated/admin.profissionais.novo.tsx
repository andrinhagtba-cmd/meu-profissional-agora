import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, UserPlus, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createProProfile, type CreateProInput } from "@/services/adminService";
import {
  AddressAutocomplete,
  type ResolvedAddress,
} from "@/components/address/AddressAutocomplete";
import { LocationMap } from "@/components/address/LocationMap";
import { DfRegionCombobox } from "@/components/shared/DfRegionCombobox";
import { isValidDfRegionName } from "@/data/dfRegions";

export const Route = createFileRoute("/_authenticated/admin/profissionais/novo")({
  head: () => ({ meta: [{ title: "Novo profissional · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminProNew,
});

const SERVICE_TYPES = [
  { value: "residencial", label: "Residencial" },
  { value: "empresarial", label: "Empresarial" },
  { value: "online", label: "Online" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "hidden", label: "Não exibir" },
  { value: "city_state", label: "Apenas RA" },
  { value: "neighborhood_city_state", label: "Bairro + RA + DF" },
  { value: "full_address", label: "Endereço completo" },
] as const;

const digits = (s: string) => s.replace(/\D/g, "");

const step1Schema = z.object({
  professional_name: z.string().trim().min(3, "Nome muito curto").max(120),
  business_name: z.string().trim().max(120).optional().or(z.literal("")),
  whatsapp: z.string().trim().optional().or(z.literal(""))
    .refine((v) => !v || digits(v).length >= 10, { message: "WhatsApp inválido (DDD + número)" }),
  city: z.string().trim().min(2, "Selecione a RA")
    .refine((v) => isValidDfRegionName(v), { message: "Escolha uma Região Administrativa oficial do DF" }),
  years_experience: z.coerce.number().int().min(0).max(80).optional(),
});

const step2Schema = z.object({
  description: z.string().trim().min(20, "Descrição precisa de pelo menos 20 caracteres").max(2000),
  starting_price: z.coerce.number().min(0).optional(),
  response_time: z.string().trim().max(60).optional().or(z.literal("")),
  availability_status: z.enum(["available", "busy", "unavailable"]),
  emergency: z.boolean(),
  service_types: z.array(z.enum(["residencial", "empresarial", "online"])).min(1, "Selecione ao menos um tipo"),
});

type Visibility = "hidden" | "city_state" | "neighborhood_city_state" | "full_address";

type Form = {
  professional_name: string; business_name: string; whatsapp: string;
  years_experience: string;
  // Localização
  city: string;             // RA do DF
  state: "DF";
  formatted_address: string;
  street: string;
  address_number: string;
  neighborhood: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
  address_complement: string;
  service_radius_km: string;
  public_address_visibility: Visibility;
  description: string; starting_price: string; response_time: string;
  availability_status: "available" | "busy" | "unavailable";
  emergency: boolean;
  service_types: ("residencial" | "empresarial" | "online")[];
  verification_status: "pending" | "approved";
  profile_status: "draft" | "published";
  is_featured: boolean;
};

const INITIAL: Form = {
  professional_name: "", business_name: "", whatsapp: "",
  years_experience: "",
  city: "", state: "DF",
  formatted_address: "", street: "", address_number: "", neighborhood: "",
  postal_code: "", latitude: null, longitude: null, google_place_id: "",
  address_complement: "", service_radius_km: "",
  public_address_visibility: "neighborhood_city_state",
  description: "", starting_price: "", response_time: "Até 24h",
  availability_status: "available", emergency: false, service_types: [],
  verification_status: "pending", profile_status: "draft", is_featured: false,
};

const STEPS = [
  { title: "Identificação", hint: "Dados básicos e localização" },
  { title: "Perfil profissional", hint: "Descrição e serviços" },
  { title: "Publicação", hint: "Situação inicial e revisão" },
];

function AdminProNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const applyAddress = (a: ResolvedAddress) => {
    setForm((f) => ({
      ...f,
      formatted_address: a.formatted_address ?? "",
      street: a.street ?? "",
      address_number: a.address_number ?? "",
      neighborhood: a.neighborhood ?? "",
      city: isValidDfRegionName(a.city ?? "") ? (a.city ?? "") : f.city,
      state: "DF",
      postal_code: a.postal_code ?? "",
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
      google_place_id: a.google_place_id ?? "",
    }));
  };

  const validateStep = (s: number): boolean => {
    const err: Record<string, string> = {};
    if (s === 0) {
      const r = step1Schema.safeParse(form);
      if (!r.success) r.error.issues.forEach((i) => { err[i.path.join(".")] = i.message; });
    } else if (s === 1) {
      const r = step2Schema.safeParse(form);
      if (!r.success) r.error.issues.forEach((i) => { err[i.path.join(".")] = i.message; });
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const mut = useMutation({
    mutationFn: (input: CreateProInput) => createProProfile(input),
    onSuccess: ({ id }) => {
      toast.success("Profissional criado com sucesso");
      navigate({ to: "/admin/profissionais/$id", params: { id }, search: { tab: "overview" } });
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao criar profissional"),
  });

  const canSubmit = useMemo(() => step === 2 && !mut.isPending, [step, mut.isPending]);

  const handleSubmit = () => {
    if (!validateStep(0) || !validateStep(1)) {
      toast.error("Revise as etapas anteriores");
      setStep(0);
      return;
    }
    mut.mutate({
      professional_name: form.professional_name.trim(),
      business_name: form.business_name.trim() || null,
      description: form.description.trim(),
      whatsapp: form.whatsapp ? digits(form.whatsapp) : null,
      city: form.city.trim(),
      state: "DF",
      years_experience: form.years_experience ? Number(form.years_experience) : null,
      starting_price: form.starting_price ? Number(form.starting_price) : null,
      response_time: form.response_time || null,
      availability_status: form.availability_status,
      emergency: form.emergency,
      service_types: form.service_types,
      verification_status: form.verification_status,
      profile_status: form.profile_status,
      is_featured: form.is_featured,
      formatted_address: form.formatted_address || null,
      street: form.street || null,
      address_number: form.address_number || null,
      neighborhood: form.neighborhood || null,
      postal_code: form.postal_code || null,
      country: "Brasil",
      latitude: form.latitude,
      longitude: form.longitude,
      google_place_id: form.google_place_id || null,
      address_complement: form.address_complement || null,
      service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : null,
      public_address_visibility: form.public_address_visibility,
    });
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 2)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="w-full min-w-0 max-w-4xl overflow-x-clip">
      <AdminPageHeader
        title="Novo profissional"
        description="Cadastro assistido para curadoria administrativa. O usuário poderá ser vinculado depois."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/admin/profissionais" })}>
            <ArrowLeft size={16} className="mr-2" />Voltar
          </Button>
        }
      />

      <div className="mb-6 min-w-0 rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa {step + 1} de {STEPS.length}</span>
          <span className="font-medium">{STEPS[step].title}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`rounded-xl border p-3 text-left transition ${
                i === step ? "border-primary bg-primary/5" :
                i < step ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50" :
                "border-border/60 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                {i < step ? <Check size={14} className="text-emerald-600" /> : <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[11px]">{i + 1}</span>}
                {s.title}
              </div>
              <div className="text-xs text-muted-foreground">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome do profissional*" error={errors.professional_name}>
                <Input value={form.professional_name} onChange={(e) => set("professional_name", e.target.value)} placeholder="Ex.: João da Silva" />
              </Field>
              <Field label="Nome da empresa" error={errors.business_name}>
                <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Opcional" />
              </Field>
              <Field label="WhatsApp" error={errors.whatsapp}>
                <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(61) 98888-7777" />
              </Field>
              <Field label="Anos de experiência" error={errors.years_experience}>
                <Input type="number" min={0} max={80} value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} />
              </Field>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Localização (Distrito Federal)</h3>
                <p className="text-xs text-muted-foreground">
                  Atendemos exclusivamente o DF. Busque o endereço no Google e selecione a Região Administrativa oficial.
                </p>
              </div>

              <div>
                <Label>Endereço (Google Maps)</Label>
                <AddressAutocomplete
                  initialQuery={form.formatted_address}
                  onSelect={applyAddress}
                  placeholder="Digite rua, número, RA…"
                />
              </div>

              <Field label="Região Administrativa (DF)*" error={errors.city}>
                <DfRegionCombobox
                  value={form.city}
                  onChange={(name) => set("city", name)}
                />
              </Field>

              <LocationMap
                latitude={form.latitude !== null ? Number(form.latitude) : null}
                longitude={form.longitude !== null ? Number(form.longitude) : null}
                radiusKm={form.service_radius_km ? Number(form.service_radius_km) : undefined}
                query={
                  [form.street, form.address_number, form.neighborhood, form.city, form.state, form.postal_code]
                    .filter(Boolean)
                    .join(", ") || form.formatted_address
                }
              />


              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Complemento">
                  <Input
                    value={form.address_complement}
                    maxLength={100}
                    onChange={(e) => set("address_complement", e.target.value)}
                    placeholder="Sala, apto, ponto de referência"
                  />
                </Field>
                <Field label="Raio de atendimento (km)">
                  <Input
                    type="number" min={0} max={500}
                    value={form.service_radius_km}
                    onChange={(e) => set("service_radius_km", e.target.value)}
                  />
                </Field>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm font-semibold">O que exibir publicamente</Label>
                <div className="flex flex-wrap gap-2">
                  {VISIBILITY_OPTIONS.map((o) => {
                    const active = form.public_address_visibility === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => set("public_address_visibility", o.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5">
            <Field label="Descrição do serviço*" error={errors.description} hint="Mínimo 20 caracteres, apresente a experiência e diferenciais.">
              <Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} />
              <div className="mt-1 text-right text-xs text-muted-foreground">{form.description.length}/2000</div>
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Preço inicial (R$)" error={errors.starting_price}>
                <Input type="number" min={0} step="0.01" value={form.starting_price} onChange={(e) => set("starting_price", e.target.value)} placeholder="150,00" />
              </Field>
              <Field label="Tempo de resposta">
                <Input value={form.response_time} onChange={(e) => set("response_time", e.target.value)} placeholder="Até 24h" />
              </Field>
              <Field label="Disponibilidade">
                <Select value={form.availability_status} onValueChange={(v) => set("availability_status", v as Form["availability_status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="busy">Ocupado</SelectItem>
                    <SelectItem value="unavailable">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Tipos de atendimento*" error={errors.service_types}>
              <div className="flex flex-wrap gap-3">
                {SERVICE_TYPES.map((t) => {
                  const checked = form.service_types.includes(t.value);
                  return (
                    <label key={t.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${checked ? "border-primary bg-primary/5" : "border-border"}`}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const on = Boolean(c);
                          set("service_types", on
                            ? [...form.service_types, t.value]
                            : form.service_types.filter((x) => x !== t.value));
                        }}
                      />
                      {t.label}
                    </label>
                  );
                })}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.emergency} onCheckedChange={(c) => set("emergency", Boolean(c))} />
              Atende chamados de emergência
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Verificação inicial">
                <Select value={form.verification_status} onValueChange={(v) => set("verification_status", v as Form["verification_status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Aguardando análise</SelectItem>
                    <SelectItem value="approved">Verificado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Situação do perfil">
                <Select value={form.profile_status} onValueChange={(v) => set("profile_status", v as Form["profile_status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Destaque">
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <Checkbox checked={form.is_featured} onCheckedChange={(c) => set("is_featured", Boolean(c))} />
                  Marcar como destaque
                </label>
              </Field>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revisão</div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Row label="Nome" value={form.professional_name} />
                <Row label="Empresa" value={form.business_name || "—"} />
                <Row label="RA / UF" value={`${form.city || "—"}/DF`} />
                <Row label="Endereço" value={form.formatted_address || "—"} />
                <Row label="WhatsApp" value={form.whatsapp || "—"} />
                <Row label="Experiência" value={form.years_experience ? `${form.years_experience} anos` : "—"} />
                <Row label="Preço inicial" value={form.starting_price ? `R$ ${form.starting_price}` : "—"} />
                <Row label="Raio (km)" value={form.service_radius_km || "—"} />
                <Row label="Atendimento" value={form.service_types.join(", ") || "—"} />
                <Row label="Emergência" value={form.emergency ? "Sim" : "Não"} />
              </dl>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={prev} disabled={step === 0} className="w-full sm:w-auto">
            <ArrowLeft size={16} className="mr-2" />Anterior
          </Button>
          {step < 2 ? (
            <Button onClick={next} className="w-full sm:w-auto">Próxima<ArrowRight size={16} className="ml-2" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full sm:w-auto">
              {mut.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserPlus size={16} className="mr-2" />}
              Criar profissional
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-semibold">{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed border-border/60 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
