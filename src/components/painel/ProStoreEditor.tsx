import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Facebook, Globe, Instagram, Loader2, MapPin, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete, type ResolvedAddress } from "@/components/address/AddressAutocomplete";
import { LocationMap } from "@/components/address/LocationMap";
import { ServiceRegionsPicker } from "@/components/shared/ServiceRegionsPicker";
import { ADDRESS_VISIBILITY_LABEL, type AddressVisibility, normalizeInstagramHandle, normalizeUrl } from "@/lib/proAddress";
import { geocodeAddressFn } from "@/lib/geocode.functions";
import { updateMyStoreProfile, type MyStorePatch, type MyStoreProfile } from "@/services/proStoreService";

type Availability = "available" | "busy" | "unavailable";

const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Disponível",
  busy: "Ocupado",
  unavailable: "Indisponível",
};

type FormState = {
  professional_name: string;
  business_name: string;
  description: string;
  whatsapp: string;
  years_experience: string;
  starting_price: string;
  price_label: string;
  response_time: string;
  availability_status: Availability;
  emergency: boolean;
  search_tags_text: string;
  instagram_username: string;
  facebook_url: string;
  website_url: string;
  postal_code: string;
  street: string;
  address_number: string;
  address_complement: string;
  address_reference: string;
  neighborhood: string;
  city: string;
  state: string;
  location_label: string;
  formatted_address: string;
  latitude: string;
  longitude: string;
  google_place_id: string;
  public_address_visibility: AddressVisibility;
  service_radius_km: string;
  service_regions: string[];
  serves_at_business_address: boolean;
  serves_at_customer_location: boolean;
  serves_remotely: boolean;
};

function toForm(pro: MyStoreProfile): FormState {
  return {
    professional_name: pro.professional_name ?? "",
    business_name: pro.business_name ?? "",
    description: pro.description ?? "",
    whatsapp: pro.whatsapp ?? "",
    years_experience: pro.years_experience != null ? String(pro.years_experience) : "",
    starting_price: pro.starting_price != null ? String(pro.starting_price) : "",
    price_label: pro.price_label ?? "",
    response_time: pro.response_time ?? "",
    availability_status: (pro.availability_status as Availability) ?? "available",
    emergency: Boolean(pro.emergency),
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
    city: pro.city ?? "",
    state: pro.state ?? "DF",
    location_label: pro.location_label ?? "",
    formatted_address: pro.formatted_address ?? "",
    latitude: pro.latitude != null ? String(pro.latitude) : "",
    longitude: pro.longitude != null ? String(pro.longitude) : "",
    google_place_id: pro.google_place_id ?? "",
    public_address_visibility: (pro.public_address_visibility as AddressVisibility) ?? "city_state",
    service_radius_km: pro.service_radius_km != null ? String(pro.service_radius_km) : "",
    service_regions: pro.service_regions ?? [],
    serves_at_business_address: Boolean(pro.serves_at_business_address),
    serves_at_customer_location: Boolean(pro.serves_at_customer_location),
    serves_remotely: Boolean(pro.serves_remotely),
  };
}

function buildPatch(pro: MyStoreProfile, f: FormState): MyStorePatch {
  const patch: MyStorePatch = {};
  const norm = (s: string) => (s.trim() === "" ? null : s.trim());
  const setIf = (k: keyof MyStorePatch, v: unknown, curr: unknown) => {
    if ((v ?? null) !== (curr ?? null)) (patch as Record<string, unknown>)[k as string] = v;
  };

  setIf("professional_name", norm(f.professional_name), pro.professional_name);
  setIf("business_name", norm(f.business_name), pro.business_name);
  setIf("description", norm(f.description), pro.description);
  setIf("whatsapp", norm(f.whatsapp), pro.whatsapp);
  setIf("response_time", norm(f.response_time), pro.response_time);
  setIf("price_label", norm(f.price_label), pro.price_label);

  const yrs = f.years_experience.trim() === "" ? null : Number(f.years_experience);
  if (yrs !== null && !Number.isFinite(yrs)) throw new Error("Anos de experiência inválido.");
  setIf("years_experience", yrs, pro.years_experience);

  const price = f.starting_price.trim() === "" ? null : Number(f.starting_price);
  if (price !== null && !Number.isFinite(price)) throw new Error("Preço inicial inválido.");
  setIf("starting_price", price, pro.starting_price);

  if (f.availability_status !== pro.availability_status) patch.availability_status = f.availability_status;
  if (Boolean(f.emergency) !== Boolean(pro.emergency)) patch.emergency = f.emergency;

  const nextTags = Array.from(
    new Set(f.search_tags_text.split(",").map((s) => s.trim().replace(/^#+/, "").toLowerCase()).filter(Boolean)),
  );
  const currTags = pro.search_tags ?? [];
  if (nextTags.length !== currTags.length || nextTags.some((v, i) => v !== currTags[i])) {
    patch.search_tags = nextTags;
  }

  const ig = normalizeInstagramHandle(f.instagram_username);
  setIf("instagram_username", ig.handle, pro.instagram_username);
  setIf("instagram_url", ig.url, pro.instagram_url);
  setIf("facebook_url", normalizeUrl(f.facebook_url), pro.facebook_url);
  setIf("website_url", normalizeUrl(f.website_url), pro.website_url);

  setIf("postal_code", norm(f.postal_code), pro.postal_code);
  setIf("street", norm(f.street), pro.street);
  setIf("address_number", norm(f.address_number), pro.address_number);
  setIf("address_complement", norm(f.address_complement), pro.address_complement);
  setIf("address_reference", norm(f.address_reference), pro.address_reference);
  setIf("neighborhood", norm(f.neighborhood), pro.neighborhood);
  setIf("city", norm(f.city), pro.city);
  setIf("state", norm(f.state) ?? "DF", pro.state);
  setIf("location_label", norm(f.location_label), pro.location_label);
  setIf("formatted_address", norm(f.formatted_address), pro.formatted_address);
  setIf("google_place_id", norm(f.google_place_id), pro.google_place_id);

  const lat = f.latitude.trim() === "" ? null : Number(f.latitude);
  if (lat !== null && !Number.isFinite(lat)) throw new Error("Latitude inválida.");
  setIf("latitude", lat, pro.latitude);
  const lng = f.longitude.trim() === "" ? null : Number(f.longitude);
  if (lng !== null && !Number.isFinite(lng)) throw new Error("Longitude inválida.");
  setIf("longitude", lng, pro.longitude);

  if (f.public_address_visibility !== pro.public_address_visibility) {
    patch.public_address_visibility = f.public_address_visibility;
  }

  const rad = f.service_radius_km.trim() === "" ? null : Number(f.service_radius_km);
  if (rad !== null && !Number.isFinite(rad)) throw new Error("Raio de atendimento inválido.");
  setIf("service_radius_km", rad, pro.service_radius_km);

  if (Boolean(f.serves_at_business_address) !== Boolean(pro.serves_at_business_address))
    patch.serves_at_business_address = f.serves_at_business_address;
  if (Boolean(f.serves_at_customer_location) !== Boolean(pro.serves_at_customer_location))
    patch.serves_at_customer_location = f.serves_at_customer_location;
  if (Boolean(f.serves_remotely) !== Boolean(pro.serves_remotely))
    patch.serves_remotely = f.serves_remotely;

  const currRegions = pro.service_regions ?? [];
  if (
    f.service_regions.length !== currRegions.length ||
    f.service_regions.some((v, i) => v !== currRegions[i])
  ) {
    patch.service_regions = f.service_regions;
  }

  return patch;
}

export function ProStoreEditor({ pro }: { pro: MyStoreProfile }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toForm(pro));

  useEffect(() => { setForm(toForm(pro)); }, [pro.id, pro.updated_at]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const addressQuery = useMemo(
    () =>
      [form.street, form.address_number, form.neighborhood, form.city, form.state, form.postal_code]
        .filter(Boolean)
        .join(", ") || form.formatted_address,
    [form.street, form.address_number, form.neighborhood, form.city, form.state, form.postal_code, form.formatted_address],
  );

  const save = useMutation({
    mutationFn: async () => {
      const patch = buildPatch(pro, form);

      const noCoords = form.latitude.trim() === "" || form.longitude.trim() === "";
      if (noCoords && addressQuery.trim().length >= 6) {
        const hit = await geocodeAddressFn({ data: { q: addressQuery } });
        if (hit) {
          patch.latitude = hit.lat;
          patch.longitude = hit.lng;
          if (!form.formatted_address.trim()) patch.formatted_address = addressQuery;
        }
      }

      if (Object.keys(patch).length === 0) return;
      await updateMyStoreProfile(pro.id, patch);
    },
    onSuccess: () => {
      toast.success("Dados da sua loja atualizados!");
      qc.invalidateQueries({ queryKey: ["my-store"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar."),
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      {/* Identidade */}
      <section>
        <SectionTitle>Dados da loja</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome profissional">
            <Input value={form.professional_name} onChange={(e) => set("professional_name", e.target.value)} />
          </Field>
          <Field label="Nome da loja / empresa">
            <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Descrição do seu negócio">
            <Textarea
              rows={6}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Conte o que você faz, diferenciais, marcas atendidas, garantia…"
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(61) 99999-9999" />
          </Field>
          <Field label="Anos de experiência">
            <Input inputMode="numeric" value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} />
          </Field>
          <Field label="Preço inicial (R$)">
            <Input inputMode="decimal" value={form.starting_price} onChange={(e) => set("starting_price", e.target.value)} />
          </Field>
          <Field label="Texto do preço">
            <Input value={form.price_label} onChange={(e) => set("price_label", e.target.value)} placeholder="A partir de" />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tempo de resposta">
            <Input value={form.response_time} onChange={(e) => set("response_time", e.target.value)} placeholder="Responde em até 1h" />
          </Field>
          <Field label="Disponibilidade">
            <Select value={form.availability_status} onValueChange={(v) => set("availability_status", v as Availability)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
                  <SelectItem key={k} value={k}>{AVAILABILITY_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end">
            <Toggle label="Atendo emergências" checked={form.emergency} onChange={(v) => set("emergency", v)} />
          </div>
        </div>
        <div className="mt-4">
          <Field label="Palavras-chave da busca (separadas por vírgula)">
            <Input
              value={form.search_tags_text}
              onChange={(e) => set("search_tags_text", e.target.value)}
              placeholder="celular, troca de tela, iphone, assistência técnica"
            />
          </Field>
        </div>
      </section>

      <Separator />

      {/* Redes */}
      <section>
        <SectionTitle>Redes sociais</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Instagram">
            <div className="relative">
              <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" value={form.instagram_username} onChange={(e) => set("instagram_username", e.target.value)} placeholder="@sualoja" />
            </div>
          </Field>
          <Field label="Facebook">
            <div className="relative">
              <Facebook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="facebook.com/sualoja" />
            </div>
          </Field>
          <Field label="Site">
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" value={form.website_url} onChange={(e) => set("website_url", e.target.value)} placeholder="sualoja.com.br" />
            </div>
          </Field>
        </div>
      </section>

      <Separator />

      {/* Endereço */}
      <section>
        <SectionTitle>Endereço da loja</SectionTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Busque o endereço e escolha o quanto dele aparece no seu perfil público.
        </p>
        <div className="mt-4 space-y-4">
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
          <div className="grid gap-4 sm:grid-cols-[1fr_140px_150px]">
            <Field label="Logradouro"><Input value={form.street} onChange={(e) => set("street", e.target.value)} /></Field>
            <Field label="Número"><Input value={form.address_number} onChange={(e) => set("address_number", e.target.value)} /></Field>
            <Field label="CEP"><Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Complemento">
              <Input maxLength={100} value={form.address_complement} onChange={(e) => set("address_complement", e.target.value)} placeholder="Loja 12, Bloco B…" />
            </Field>
            <Field label="Ponto de referência">
              <Input maxLength={140} value={form.address_reference} onChange={(e) => set("address_reference", e.target.value)} placeholder="Em frente à praça…" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Bairro"><Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} /></Field>
            <Field label="Cidade / Região Administrativa">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="UF">
              <Input maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </Field>
          </div>
          <Field label="Nome personalizado do local (opcional)">
            <Input maxLength={80} value={form.location_label} onChange={(e) => set("location_label", e.target.value)} placeholder="Ex: Feira dos Importados" />
          </Field>
          <Field label="Privacidade do endereço no perfil público">
            <Select
              value={form.public_address_visibility}
              onValueChange={(v) => set("public_address_visibility", v as AddressVisibility)}
            >
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
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
            query={addressQuery}
          />
        </div>
      </section>

      <Separator />

      {/* Áreas atendidas */}
      <section>
        <SectionTitle>
          <span className="inline-flex items-center gap-2"><MapPin size={15} /> Áreas atendidas</span>
        </SectionTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Marque as Regiões Administrativas de Brasília, bairros (Asa Sul, Asa Norte…) e cidades do Entorno onde você atende.
          Elas aparecem no seu perfil público e ajudam os clientes a te encontrar na busca.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Raio de atendimento (km)">
            <Input inputMode="numeric" value={form.service_radius_km} onChange={(e) => set("service_radius_km", e.target.value)} placeholder="ex: 25" />
          </Field>
          <div className="grid gap-2">
            <Toggle label="Atendo no meu endereço" checked={form.serves_at_business_address} onChange={(v) => set("serves_at_business_address", v)} />
            <Toggle label="Vou até o cliente" checked={form.serves_at_customer_location} onChange={(v) => set("serves_at_customer_location", v)} />
            <Toggle label="Atendimento remoto/online" checked={form.serves_remotely} onChange={(v) => set("serves_remotely", v)} />
          </div>
        </div>
        <div className="mt-4">
          <ServiceRegionsPicker
            value={form.service_regions}
            onChange={(next) => set("service_regions", next)}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={save.isPending} className="h-12 rounded-xl px-6 font-semibold">
          {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {save.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl px-5 font-semibold"
          onClick={() => setForm(toForm(pro))}
          disabled={save.isPending}
        >
          Desfazer
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-background px-3">
      <span className="text-xs font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
