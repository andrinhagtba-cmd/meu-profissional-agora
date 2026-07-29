import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { BadgeCheck, ExternalLink, Eye, Facebook, Globe, Instagram, MapPin, MessageCircle, Save, Send, Undo2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { InitialsAvatar, StatusPill } from "@/components/admin/AdminTable";
import { updateProProfile, type AdminProDetail, type AdminProProfilePatch } from "@/services/adminService";
import { AddressAutocomplete, type ResolvedAddress } from "@/components/address/AddressAutocomplete";
import { LocationMap } from "@/components/address/LocationMap";
import { BusinessHoursSection } from "@/components/professional/BusinessHoursSection";
import { ADDRESS_VISIBILITY_LABEL, type AddressVisibility, normalizeInstagramHandle, normalizeUrl } from "@/lib/proAddress";


type Availability = "available" | "busy" | "unavailable";
type ProfileStatus = "draft" | "published" | "archived";

type FormState = {
  professional_name: string;
  business_name: string;
  slug: string;
  description: string;
  city: string;
  state: string;
  whatsapp: string;
  years_experience: string;
  starting_price: string;
  response_time: string;
  availability_status: Availability;
  emergency: boolean;
  is_featured: boolean;
  service_types_text: string;
  search_tags_text: string;
  // Social
  instagram_username: string;
  facebook_url: string;
  website_url: string;
  // Endereço
  postal_code: string;
  street: string;
  address_number: string;
  address_complement: string;
  address_reference: string;
  neighborhood: string;
  latitude: string;
  longitude: string;
  google_place_id: string;
  formatted_address: string;
  public_address_visibility: AddressVisibility;
  // Atendimento
  service_radius_km: string;
  serves_at_business_address: boolean;
  serves_at_customer_location: boolean;
  serves_remotely: boolean;
};

const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Disponível",
  busy: "Ocupado",
  unavailable: "Indisponível",
};

function toForm(pro: AdminProDetail): FormState {
  return {
    professional_name: pro.professional_name ?? "",
    business_name: pro.business_name ?? "",
    slug: pro.slug ?? "",
    description: pro.description ?? "",
    city: pro.city ?? "",
    state: pro.state ?? "",
    whatsapp: pro.whatsapp ?? "",
    years_experience: pro.years_experience?.toString() ?? "",
    starting_price: pro.starting_price != null ? String(pro.starting_price) : "",
    response_time: pro.response_time ?? "",
    availability_status: (pro.availability_status as Availability) ?? "available",
    emergency: Boolean(pro.emergency),
    is_featured: Boolean(pro.is_featured),
    service_types_text: (pro.service_types ?? []).join(", "),
    search_tags_text: (pro.search_tags ?? []).join(", "),
    instagram_username: pro.instagram_username ?? "",
    facebook_url: pro.facebook_url ?? "",
    website_url: pro.website_url ?? "",
    postal_code: pro.postal_code ?? "",
    street: pro.street ?? "",
    address_number: pro.address_number ?? "",
    address_complement: pro.address_complement ?? "",
    address_reference: pro.address_reference ?? "",
    neighborhood: pro.neighborhood ?? "",
    latitude: pro.latitude != null ? String(pro.latitude) : "",
    longitude: pro.longitude != null ? String(pro.longitude) : "",
    google_place_id: pro.google_place_id ?? "",
    formatted_address: pro.formatted_address ?? "",
    public_address_visibility: (pro.public_address_visibility as AddressVisibility) ?? "city_state",
    service_radius_km: pro.service_radius_km != null ? String(pro.service_radius_km) : "",
    serves_at_business_address: Boolean(pro.serves_at_business_address),
    serves_at_customer_location: Boolean(pro.serves_at_customer_location),
    serves_remotely: Boolean(pro.serves_remotely),
  };
}

function diffPatch(pro: AdminProDetail, f: FormState): AdminProProfilePatch {
  const patch: AdminProProfilePatch = {};
  const norm = (s: string) => (s.trim() === "" ? null : s.trim());
  const setIf = <K extends keyof AdminProProfilePatch>(k: K, v: AdminProProfilePatch[K], curr: unknown) => {
    if ((v ?? null) !== (curr ?? null)) (patch as Record<string, unknown>)[k as string] = v;
  };
  setIf("professional_name", norm(f.professional_name), pro.professional_name);
  setIf("business_name", norm(f.business_name), pro.business_name);
  const slugNorm = f.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  setIf("slug", slugNorm === "" ? null : slugNorm, pro.slug);
  setIf("description", norm(f.description), pro.description);
  setIf("city", norm(f.city), pro.city);
  setIf("state", norm(f.state), pro.state);
  setIf("whatsapp", norm(f.whatsapp), pro.whatsapp);
  setIf("response_time", norm(f.response_time), pro.response_time);

  const yrs = f.years_experience.trim() === "" ? null : Number(f.years_experience);
  if (yrs !== null && !Number.isFinite(yrs)) throw new Error("Anos de experiência inválido.");
  setIf("years_experience", yrs, pro.years_experience);

  const price = f.starting_price.trim() === "" ? null : Number(f.starting_price);
  if (price !== null && !Number.isFinite(price)) throw new Error("Preço inicial inválido.");
  setIf("starting_price", price, pro.starting_price);

  if (f.availability_status !== pro.availability_status) patch.availability_status = f.availability_status;
  if (Boolean(f.emergency) !== Boolean(pro.emergency)) patch.emergency = f.emergency;
  if (Boolean(f.is_featured) !== Boolean(pro.is_featured)) patch.is_featured = f.is_featured;

  const nextTypes = Array.from(
    new Set(
      f.service_types_text.split(",").map((s) => s.trim()).filter(Boolean),
    ),
  );
  const currTypes = pro.service_types ?? [];
  const changedTypes =
    nextTypes.length !== currTypes.length || nextTypes.some((v, i) => v !== currTypes[i]);
  if (changedTypes) patch.service_types = nextTypes;

  const nextTags = Array.from(
    new Set(
      f.search_tags_text.split(",").map((s) => s.trim().replace(/^#+/, "").toLowerCase()).filter(Boolean),
    ),
  );
  const currTags = pro.search_tags ?? [];
  const changedTags =
    nextTags.length !== currTags.length || nextTags.some((v, i) => v !== currTags[i]);
  if (changedTags) patch.search_tags = nextTags;

  // Redes sociais
  const ig = normalizeInstagramHandle(f.instagram_username);
  setIf("instagram_username", ig.handle, pro.instagram_username);
  setIf("instagram_url", ig.url, pro.instagram_url);
  setIf("facebook_url", normalizeUrl(f.facebook_url), pro.facebook_url);
  setIf("website_url", normalizeUrl(f.website_url), pro.website_url);

  // Endereço
  setIf("postal_code", norm(f.postal_code), pro.postal_code);
  setIf("street", norm(f.street), pro.street);
  setIf("address_number", norm(f.address_number), pro.address_number);
  setIf("address_complement", norm(f.address_complement), pro.address_complement);
  setIf("address_reference", norm(f.address_reference), pro.address_reference);
  setIf("neighborhood", norm(f.neighborhood), pro.neighborhood);
  setIf("google_place_id", norm(f.google_place_id), pro.google_place_id);
  setIf("formatted_address", norm(f.formatted_address), pro.formatted_address);
  const lat = f.latitude.trim() === "" ? null : Number(f.latitude);
  if (lat !== null && !Number.isFinite(lat)) throw new Error("Latitude inválida.");
  setIf("latitude", lat, pro.latitude);
  const lng = f.longitude.trim() === "" ? null : Number(f.longitude);
  if (lng !== null && !Number.isFinite(lng)) throw new Error("Longitude inválida.");
  setIf("longitude", lng, pro.longitude);
  if (f.public_address_visibility !== pro.public_address_visibility) {
    patch.public_address_visibility = f.public_address_visibility;
  }

  // Atendimento
  const rad = f.service_radius_km.trim() === "" ? null : Number(f.service_radius_km);
  if (rad !== null && !Number.isFinite(rad)) throw new Error("Raio inválido.");
  setIf("service_radius_km", rad, pro.service_radius_km);
  if (Boolean(f.serves_at_business_address) !== Boolean(pro.serves_at_business_address))
    patch.serves_at_business_address = f.serves_at_business_address;
  if (Boolean(f.serves_at_customer_location) !== Boolean(pro.serves_at_customer_location))
    patch.serves_at_customer_location = f.serves_at_customer_location;
  if (Boolean(f.serves_remotely) !== Boolean(pro.serves_remotely))
    patch.serves_remotely = f.serves_remotely;

  return patch;
}

export function AdminProProfileEditor({ pro }: { pro: AdminProDetail }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toForm(pro));

  useEffect(() => { setForm(toForm(pro)); }, [pro.id, pro.updated_at]); // reset on refetch

  const patch = useMemo(() => {
    try { return diffPatch(pro, form); }
    catch { return null; }
  }, [pro, form]);
  const dirty = patch === null || Object.keys(patch).length > 0;

  const save = useMutation({
    mutationFn: async (nextStatus?: ProfileStatus) => {
      const p = diffPatch(pro, form);
      if (nextStatus && nextStatus !== pro.profile_status) p.profile_status = nextStatus;
      if (Object.keys(p).length === 0) return;
      await updateProProfile(pro.id, p);
    },
    onSuccess: (_d, nextStatus) => {
      toast.success(
        nextStatus === "published"
          ? "Perfil publicado"
          : nextStatus === "draft"
            ? "Salvo como rascunho"
            : "Alterações salvas",
      );
      qc.invalidateQueries({ queryKey: ["admin-pro-detail", pro.id] });
      qc.invalidateQueries({ queryKey: ["admin-pros"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publicHref = pro.slug ? `/profissional/${pro.slug}` : null;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr),390px]">
      {/* Editor */}
      <Card className="overflow-hidden rounded-[1.7rem] border-border/70 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-background/70 pb-4">
          <div>
            <CardTitle className="font-display text-xl font-extrabold tracking-normal">Perfil público</CardTitle>
            <p className="text-xs text-muted-foreground">Dados exibidos na busca e na página pública.</p>
          </div>
          <StatusPill tone={pro.profile_status === "published" ? "success" : pro.profile_status === "archived" ? "danger" : "warning"}>
            {pro.profile_status === "published" ? "Publicado" : pro.profile_status === "archived" ? "Suspenso" : "Rascunho"}
          </StatusPill>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">

          <div className="grid gap-3 sm:grid-cols-2">

            <Field label="Nome do profissional" required>
              <Input value={form.professional_name} onChange={(e) => set("professional_name", e.target.value)} />
            </Field>
            <Field label="Nome comercial / empresa">
              <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
            </Field>
          </div>

          <Field label="Descrição / apresentação">
            <Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Bio pública, especialidades, diferenciais…" />
          </Field>

          <Field label="Slug público (URL)">
            <Input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="ex: heitor-frannini"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Usado em /profissional/&lt;slug&gt;. Apenas letras, números e hífen.
            </p>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp">
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="55 11 90000-0000" />
            </Field>
          </div>


          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Anos de experiência">
              <Input inputMode="numeric" value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} />
            </Field>
            <Field label="Preço inicial (R$)">
              <Input inputMode="decimal" value={form.starting_price} onChange={(e) => set("starting_price", e.target.value)} />
            </Field>
            <Field label="Tempo de resposta">
              <Input value={form.response_time} onChange={(e) => set("response_time", e.target.value)} placeholder="Até 1h" />
            </Field>
          </div>

          <Field label="Tipos de atendimento">
            <div className="flex flex-wrap gap-2">
              {(["residencial", "empresarial", "online"] as const).map((t) => {
                const list = form.service_types_text.split(",").map((s) => s.trim()).filter(Boolean);
                const active = list.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const next = active ? list.filter((x) => x !== t) : [...list, t];
                      set("service_types_text", next.join(", "));
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Categorias/especialidades são gerenciadas na aba Serviços.</p>
          </Field>


          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Disponibilidade">
              <Select value={form.availability_status} onValueChange={(v) => set("availability_status", v as Availability)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
                    <SelectItem key={k} value={k}>{AVAILABILITY_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Aceita emergência" checked={form.emergency} onChange={(v) => set("emergency", v)} />
              <Toggle label="Destaque" checked={form.is_featured} onChange={(v) => set("is_featured", v)} />
            </div>
          </div>

          <ViewsCounterSection professionalId={pro.id} initialFromDb={pro.initial_view_count ?? 0} realFromDb={pro.real_view_count ?? 0} />

          <Field label="Hashtags / palavras-chave">
            <Input
              value={form.search_tags_text}
              onChange={(e) => set("search_tags_text", e.target.value)}
              placeholder="ex: trafego pago, marketing digital, gestao de anuncios"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Separe por vírgula. Essas tags ajudam o profissional a aparecer na busca do site.
            </p>
          </Field>

          <Separator />

          {/* Horário de funcionamento */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Horário de funcionamento
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Horários no fuso de Brasília. Aparecem no perfil público com o selo “Aberto agora”.
            </p>
            <div className="mt-4">
              <BusinessHoursSection professionalId={pro.id} holidayNote={pro.holiday_note} />
            </div>
          </div>

          <Separator />

          {/* Presença digital */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Presença digital</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Instagram">
                <div className="relative">
                  <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    value={form.instagram_username}
                    onChange={(e) => set("instagram_username", e.target.value)}
                    placeholder="@usuario ou link"
                  />
                </div>
              </Field>
              <Field label="Facebook">
                <div className="relative">
                  <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    value={form.facebook_url}
                    onChange={(e) => set("facebook_url", e.target.value)}
                    placeholder="facebook.com/pagina"
                  />
                </div>
              </Field>
              <Field label="Website">
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    value={form.website_url}
                    onChange={(e) => set("website_url", e.target.value)}
                    placeholder="meudominio.com.br"
                  />
                </div>
              </Field>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Endereço profissional</h3>
            <p className="mt-1 text-xs text-muted-foreground">Busque o endereço no Google e ajuste a privacidade exibida no perfil.</p>
            <div className="mt-3 space-y-3">
              <AddressAutocomplete
                initialQuery={form.formatted_address}
                onSelect={(r: ResolvedAddress) => {
                  setForm((prev) => ({
                    ...prev,
                    formatted_address: r.formatted_address ?? prev.formatted_address,
                    street: r.street ?? prev.street,
                    address_number: r.address_number ?? prev.address_number,
                    neighborhood: r.neighborhood ?? prev.neighborhood,
                    city: r.city ?? prev.city,
                    state: r.state ?? prev.state,
                    postal_code: r.postal_code ?? prev.postal_code,
                    latitude: r.latitude != null ? String(r.latitude) : "",
                    longitude: r.longitude != null ? String(r.longitude) : "",
                    google_place_id: r.google_place_id ?? "",
                  }));
                }}
              />

              <div className="grid gap-3 sm:grid-cols-[1fr,140px,140px]">
                <Field label="Logradouro">
                  <Input value={form.street} onChange={(e) => set("street", e.target.value)} />
                </Field>
                <Field label="Número">
                  <Input value={form.address_number} onChange={(e) => set("address_number", e.target.value)} />
                </Field>
                <Field label="CEP">
                  <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Complemento">
                  <Input
                    value={form.address_complement}
                    maxLength={100}
                    onChange={(e) => set("address_complement", e.target.value)}
                    placeholder="Sala 204, Bloco B, Loja 12…"
                  />
                </Field>
                <Field label="Ponto de referência">
                  <Input
                    value={form.address_reference}
                    maxLength={140}
                    onChange={(e) => set("address_reference", e.target.value)}
                    placeholder="Próximo ao mercado, em frente à praça…"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Bairro">
                  <Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
                </Field>
                <Field label="Cidade">
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="UF">
                  <Input maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
                </Field>
              </div>

              <Field label="Privacidade do endereço no perfil público">
                <Select
                  value={form.public_address_visibility}
                  onValueChange={(v) => set("public_address_visibility", v as AddressVisibility)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ADDRESS_VISIBILITY_LABEL) as AddressVisibility[]).map((k) => (
                      <SelectItem key={k} value={k}>{ADDRESS_VISIBILITY_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <LocationMap
                latitude={form.latitude ? Number(form.latitude) : null}
                longitude={form.longitude ? Number(form.longitude) : null}
                radiusKm={form.service_radius_km ? Number(form.service_radius_km) : null}
              />
            </div>
          </div>

          <Separator />

          {/* Área de atendimento */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Área de atendimento</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Raio de atendimento (km)">
                <Input
                  inputMode="numeric"
                  value={form.service_radius_km}
                  onChange={(e) => set("service_radius_km", e.target.value)}
                  placeholder="ex: 25"
                />
              </Field>
              <div className="grid grid-cols-1 gap-2">
                <Toggle label="Atende no meu endereço" checked={form.serves_at_business_address} onChange={(v) => set("serves_at_business_address", v)} />
                <Toggle label="Vou até o cliente" checked={form.serves_at_customer_location} onChange={(v) => set("serves_at_customer_location", v)} />
                <Toggle label="Atendimento remoto/online" checked={form.serves_remotely} onChange={(v) => set("serves_remotely", v)} />
              </div>
            </div>
          </div>

          <Separator />


          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {dirty ? "Você tem alterações não salvas." : "Tudo salvo."}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setForm(toForm(pro))}
                disabled={!dirty || save.isPending}
              >
                <Undo2 size={14} className="mr-1.5" /> Descartar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => save.mutate("draft")}
                disabled={save.isPending || (!dirty && pro.profile_status === "draft")}
              >
                <Save size={14} className="mr-1.5" /> Salvar como rascunho
              </Button>
              <Button
                size="sm"
                onClick={() => save.mutate("published")}
                disabled={save.isPending}
              >
                <Send size={14} className="mr-1.5" /> {pro.profile_status === "published" ? "Salvar e republicar" : "Publicar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <aside className="space-y-3">
        <Card className="sticky top-24 overflow-hidden rounded-[1.7rem] border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b bg-background/70 pb-4">
            <div className="flex items-center gap-1.5">
              <Eye size={14} className="text-muted-foreground" />
              <CardTitle className="font-display text-base font-extrabold tracking-normal">Prévia pública</CardTitle>
            </div>
            {publicHref && (
              <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                <a href={publicHref} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} className="mr-1" /> Público
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <PreviewCard pro={pro} form={form} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function PreviewCard({ pro, form }: { pro: AdminProDetail; form: FormState }) {
  const name = form.professional_name || form.business_name || "Sem nome";
  const location = [form.city, form.state].filter(Boolean).join("/");
  const types = form.service_types_text.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-card">
      <div className="h-24 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_92%,white),color-mix(in_oklab,var(--primary)_54%,var(--orange)))]" />
      <div className="-mt-8 px-4 pb-4">
        <InitialsAvatar name={name} className="h-16 w-16 border-4 border-card text-xl" />
        <div className="mt-2 flex items-center gap-1.5">
          <h3 className="text-base font-semibold">{name}</h3>
          {pro.verification_status === "approved" && <BadgeCheck size={15} className="text-primary" />}
        </div>
        {form.business_name && form.business_name !== form.professional_name && (
          <div className="text-xs text-muted-foreground">{form.business_name}</div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {location && (<span className="inline-flex items-center gap-1"><MapPin size={11} />{location}</span>)}
          {form.response_time && (<span className="inline-flex items-center gap-1">⏱ {form.response_time}</span>)}
          {form.emergency && (<span className="inline-flex items-center gap-1 text-orange"><Zap size={11} /> Emergência</span>)}
        </div>
        {types.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {types.slice(0, 6).map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{t}</span>
            ))}
          </div>
        )}
        {form.description && (
          <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
            {form.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold">
            {form.starting_price ? `A partir de R$ ${Number(form.starting_price).toFixed(2)}` : "Sob orçamento"}
          </span>
          {form.whatsapp && (
            <span className="inline-flex items-center gap-1 text-primary"><MessageCircle size={12} /> WhatsApp</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex h-10 cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-background px-3">
      <span className="text-xs font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function ViewsCounterSection({
  professionalId,
  initialFromDb,
  realFromDb,
}: {
  professionalId: string;
  initialFromDb: number;
  realFromDb: number;
}) {
  const [initial, setInitial] = useState<string>(String(initialFromDb ?? 0));
  const [real, setReal] = useState<number>(realFromDb ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInitial(String(initialFromDb ?? 0));
    setReal(realFromDb ?? 0);
  }, [initialFromDb, realFromDb]);

  const total = (Number(initial) || 0) + (real || 0);

  const save = async () => {
    const v = Math.max(0, Math.floor(Number(initial) || 0));
    setSaving(true);
    try {
      const { adminSetInitialViewCount } = await import("@/services/profileViewsService");
      await adminSetInitialViewCount(professionalId, v);
      toast.success("Contador inicial atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar contador.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Eye size={16} className="text-primary" />
        <h3 className="font-display text-sm font-extrabold">Visibilidade e contador de visitas</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Contador inicial de visitas">
          <Input
            type="number"
            min={0}
            step={1}
            value={initial}
            onChange={(e) => setInitial(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ex.: 200"
          />
        </Field>
        <Field label="Visitas reais (somente leitura)">
          <Input value={real.toLocaleString("pt-BR")} readOnly disabled />
        </Field>
        <Field label="Total público exibido">
          <Input value={total.toLocaleString("pt-BR")} readOnly disabled />
        </Field>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Este valor será somado às visitas reais recebidas pelo perfil. As visitas reais são registradas
        automaticamente pelo sistema e não são alteradas por este campo.
      </p>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={save} disabled={saving} className="rounded-full">
          <Save size={14} /> Salvar contador inicial
        </Button>
      </div>
    </div>
  );
}


