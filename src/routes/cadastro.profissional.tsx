import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  Instagram,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { z } from "zod";
import { listCategories, type CategoryVM } from "@/services/categoryService";
import {
  getMyOnboarding,
  saveOnboarding,
  publishOnboarding,
  type OnboardingProfile,
} from "@/services/onboardingService";
import {
  uploadAvatar,
  uploadCover,
  addPortfolioItem,
  deletePortfolioItem,
  listPortfolio,
  type PortfolioItemVM,
} from "@/services/professionalMediaService";
import {
  AddressAutocomplete,
  type ResolvedAddress,
} from "@/components/address/AddressAutocomplete";
import { BusinessHoursSection } from "@/components/professional/BusinessHoursSection";
import { LocationMap } from "@/components/address/LocationMap";
import { DfRegionCombobox } from "@/components/shared/DfRegionCombobox";
import { isValidDfRegionName } from "@/data/dfRegions";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";

export const Route = createFileRoute("/cadastro/profissional")({
  component: SignupWizard,
});

const DRAFT_KEY = "pro_signup_draft_v1";

const SERVICE_TYPES: { value: string; label: string }[] = [
  { value: "residencial", label: "Residencial" },
  { value: "empresarial", label: "Empresarial" },
  { value: "online", label: "Online" },
];

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "city_state", label: "Cidade/Estado" },
  { value: "neighborhood_city_state", label: "Bairro, cidade/estado" },
  { value: "full_address", label: "Endereço completo" },
  { value: "hidden", label: "Não exibir" },
];

const STEPS = [
  { n: 1, title: "Conta", icon: UserPlus },
  { n: 2, title: "Sobre você", icon: Sparkles },
  { n: 3, title: "Onde você atua", icon: MapPin },
  { n: 4, title: "Portfólio & Redes", icon: ImagePlus },
  { n: 5, title: "Publicar", icon: CheckCircle2 },
];

const step1Schema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20),
});

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function SignupWizard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [categories, setCategories] = useState<CategoryVM[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItemVM[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const patchRef = useRef<Partial<OnboardingProfile>>({});
  const timerRef = useRef<number | null>(null);

  // Step 1 form
  const [s1, setS1] = useState(() => {
    if (typeof window === "undefined") return { fullName: "", email: "", password: "", whatsapp: "" };
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const j = JSON.parse(raw);
        return { fullName: j.fullName ?? "", email: j.email ?? "", password: "", whatsapp: j.whatsapp ?? "" };
      }
    } catch {}
    return { fullName: "", email: "", password: "", whatsapp: "" };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ fullName: s1.fullName, email: s1.email, whatsapp: s1.whatsapp }),
      );
    } catch {}
  }, [s1.fullName, s1.email, s1.whatsapp]);

  // Load session + profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!mounted) return;
      setUserId(uid);
      if (uid) {
        try {
          const p = await getMyOnboarding(uid);
          if (!mounted) return;
          if (p) {
            setProfile(p);
            setStep(Math.max(2, Math.min(5, p.onboarding_step || 2)));
            const [cats, folio] = await Promise.all([
              listCategories(),
              listPortfolio(p.id),
            ]);
            if (!mounted) return;
            setCategories(cats);
            setPortfolio(folio);
            // derive selectedCategories from search_tags
            const tags = new Set((p.search_tags ?? []).map((t) => t.toLowerCase()));
            setSelectedCategories(cats.filter((c) => tags.has(c.slug)).map((c) => c.id));
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // load categories anyway for later
        try {
          const cats = await listCategories();
          if (mounted) setCategories(cats);
        } catch {}
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced autosave for steps 2-5
  const scheduleSave = useCallback(
    (patch: Partial<OnboardingProfile>) => {
      if (!userId) return;
      patchRef.current = { ...patchRef.current, ...patch };
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(async () => {
        const p = patchRef.current;
        patchRef.current = {};
        if (Object.keys(p).length === 0) return;
        setAutoSaving(true);
        try {
          await saveOnboarding(userId, p);
          setSavedAt(new Date());
        } catch (e) {
          console.error(e);
          toast.error("Falha ao salvar rascunho");
        } finally {
          setAutoSaving(false);
        }
      }, 900);
    },
    [userId],
  );

  function updateProfile(patch: Partial<OnboardingProfile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    scheduleSave(patch);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    const parsed = step1Schema.safeParse(s1);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: s1.email,
        password: s1.password,
        options: {
          emailRedirectTo: `${window.location.origin}/cadastro/profissional`,
          data: {
            full_name: s1.fullName,
            phone: s1.whatsapp,
            role: "profissional",
          },
        },
      });
      if (error) throw error;
      const uid = data.session?.user?.id ?? data.user?.id ?? null;
      if (!data.session) {
        toast.success("Conta criada! Verifique seu e-mail para confirmar e continuar.");
        return;
      }
      setUserId(uid);
      // Give trigger a beat to create the profile row
      await new Promise((r) => setTimeout(r, 700));
      if (uid) {
        try {
          await saveOnboarding(uid, {
            professional_name: s1.fullName,
            whatsapp: s1.whatsapp,
            onboarding_step: 2,
          });
        } catch {}
        const p = await getMyOnboarding(uid);
        if (p) {
          setProfile(p);
          const [cats, folio] = await Promise.all([
            listCategories(),
            listPortfolio(p.id),
          ]);
          setCategories(cats);
          setPortfolio(folio);
        }
      }
      setStep(2);
      toast.success("Conta criada com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    if (!userId || !profile) return;
    // Validate per step
    if (step === 2) {
      if (!profile.description || profile.description.trim().length < 40) {
        toast.error("Escreva uma bio com pelo menos 40 caracteres");
        return;
      }
      if (selectedCategories.length === 0) {
        toast.error("Selecione ao menos 1 categoria");
        return;
      }
    }
    if (step === 3) {
      if (!profile.city || !isValidDfRegionName(profile.city)) {
        toast.error("Selecione uma Região Administrativa válida do DF");
        return;
      }
      if (profile.state && profile.state !== "DF") {
        toast.error("Esta plataforma atende exclusivamente o Distrito Federal");
        return;
      }
    }
    const next = Math.min(5, step + 1);
    setBusy(true);
    try {
      await saveOnboarding(userId, { onboarding_step: next });
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  async function handlePublish() {
    if (!userId) return;
    setBusy(true);
    try {
      await publishOnboarding(userId);
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {}
      toast.success("Perfil publicado! Bem-vindo(a) 🎉");
      navigate({ to: "/painel" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao publicar");
    } finally {
      setBusy(false);
    }
  }

  // Media handlers
  async function handleAvatarUpload(file: File) {
    if (!userId || !profile) return;
    setBusy(true);
    try {
      const r = await uploadAvatar(userId, profile.id, file);
      setProfile({ ...profile, avatar_media_id: r.mediaId, avatar_url: r.url });
    } catch (e) {
      toast.error("Falha no upload");
    } finally {
      setBusy(false);
    }
  }
  async function handleCoverUpload(file: File) {
    if (!userId || !profile) return;
    setBusy(true);
    try {
      const r = await uploadCover(userId, profile.id, file);
      setProfile({ ...profile, cover_media_id: r.mediaId, cover_url: r.url });
    } catch (e) {
      toast.error("Falha no upload");
    } finally {
      setBusy(false);
    }
  }
  async function handlePortfolioAdd(file: File) {
    if (!userId || !profile) return;
    setBusy(true);
    try {
      await addPortfolioItem(userId, profile.id, file.name.split(".")[0] || "Trabalho", file);
      setPortfolio(await listPortfolio(profile.id));
    } catch {
      toast.error("Falha ao adicionar item");
    } finally {
      setBusy(false);
    }
  }
  async function handlePortfolioRemove(id: string) {
    if (!profile) return;
    try {
      await deletePortfolioItem(id);
      setPortfolio(await listPortfolio(profile.id));
    } catch {
      toast.error("Falha ao remover");
    }
  }

  function toggleCategory(id: string, slug: string) {
    setSelectedCategories((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id];
      // update search_tags to include slugs of selected categories (keep custom tags)
      if (profile) {
        const customTags = (profile.search_tags ?? []).filter(
          (t) => !categories.some((c) => c.slug === t),
        );
        const catSlugs = categories.filter((c) => next.includes(c.id)).map((c) => c.slug);
        updateProfile({ search_tags: [...customTags, ...catSlugs] });
      }
      return next;
    });
  }

  function toggleServiceType(v: string) {
    if (!profile) return;
    const cur = profile.service_types ?? [];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    updateProfile({ service_types: next });
  }

  const progress = useMemo(() => Math.round((step / 5) * 100), [step]);

  return (
    <SiteLayout>
      <div className="min-h-[70vh] bg-[#F7F9FD] py-8 md:py-12">
        <div className="container-page max-w-4xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={14} /> Torne-se um profissional
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Crie seu perfil em 5 passos
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Você pode sair e continuar de onde parou a qualquer momento.
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Etapa {step} de 5</span>
              <span className="inline-flex items-center gap-2">
                {autoSaving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Salvando…
                  </>
                ) : savedAt ? (
                  <>
                    <Save size={12} /> Rascunho salvo
                  </>
                ) : (
                  <span>{progress}% concluído</span>
                )}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-orange transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 hidden gap-2 md:flex">
              {STEPS.map((s) => {
                const active = step === s.n;
                const done = step > s.n;
                const Icon = s.icon;
                return (
                  <div
                    key={s.n}
                    className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : done
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border bg-white text-muted-foreground"
                    }`}
                  >
                    <Icon size={14} /> {s.title}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
            {step === 1 && !userId && (
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold">Vamos criar sua conta</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Depois disso, vamos montar seu perfil público.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Nome completo</Label>
                    <Input
                      value={s1.fullName}
                      maxLength={100}
                      onChange={(e) => setS1({ ...s1, fullName: e.target.value })}
                      placeholder="Ex: Ana Silva"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input
                      value={s1.whatsapp}
                      maxLength={20}
                      onChange={(e) => setS1({ ...s1, whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={s1.email}
                      maxLength={255}
                      onChange={(e) => setS1({ ...s1, email: e.target.value })}
                      placeholder="voce@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={s1.password}
                      maxLength={72}
                      onChange={(e) => setS1({ ...s1, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <a href="/auth" className="text-sm text-primary hover:underline">
                    Já tenho conta
                  </a>
                  <Button type="submit" disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Criar conta e continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 1 && userId && (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <h2 className="text-xl font-semibold">Você já está autenticado</h2>
                <p className="text-sm text-muted-foreground">
                  Vamos continuar seu cadastro de onde você parou.
                </p>
                <Button onClick={() => setStep(Math.max(2, profile?.onboarding_step ?? 2))}>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && profile && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Conte sobre você</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Isso aparece no seu perfil público e ajuda clientes a te encontrarem.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <AvatarUploader url={profile.avatar_url} onFile={handleAvatarUpload} busy={busy} />
                  <div className="flex-1">
                    <Label>Nome público</Label>
                    <Input
                      value={profile.professional_name ?? ""}
                      maxLength={100}
                      onChange={(e) => updateProfile({ professional_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Bio curta (o que você faz de melhor)</Label>
                  <Textarea
                    value={profile.description ?? ""}
                    maxLength={800}
                    rows={4}
                    onChange={(e) => updateProfile({ description: e.target.value })}
                    placeholder="Ex: Sou eletricista há 12 anos, especialista em residências e pequenos comércios."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(profile.description ?? "").length}/800
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Anos de experiência</Label>
                    <Input
                      type="number"
                      min={0}
                      max={80}
                      value={profile.years_experience ?? ""}
                      onChange={(e) =>
                        updateProfile({
                          years_experience: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Modalidade de atendimento</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {SERVICE_TYPES.map((s) => {
                        const active = (profile.service_types ?? []).includes(s.value);
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => toggleServiceType(s.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-white text-foreground hover:border-primary/40"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Categorias (até 3)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const active = selectedCategories.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCategory(c.id, c.slug)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? "border-orange bg-orange text-white"
                              : "border-border bg-white text-foreground hover:border-orange/40"
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Hashtags / palavras-chave</Label>
                  <Input
                    value={customTagsText}
                    onChange={(e) => setCustomTags(e.target.value)}
                    placeholder="ex: trafego pago, marketing digital, gestao de anuncios"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Separe por vírgula. Essas palavras ajudam clientes a te encontrarem na busca.
                  </p>
                </div>

              </div>
            )}

            {step === 3 && profile && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Onde você atua</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Buscamos seu endereço para mostrar profissionais próximos aos clientes.
                  </p>
                </div>

                <div>
                  <Label>Endereço</Label>
                  <AddressAutocomplete
                    initialQuery={profile.formatted_address ?? ""}
                    onSelect={(a: ResolvedAddress) =>
                      updateProfile({
                        formatted_address: a.formatted_address ?? profile.formatted_address,
                        street: a.street ?? profile.street,
                        address_number: a.address_number ?? profile.address_number,
                        neighborhood: a.neighborhood ?? profile.neighborhood,
                        city: isValidDfRegionName(a.city ?? "") ? a.city : profile.city,
                        state: "DF",
                        postal_code: a.postal_code ?? profile.postal_code,
                        country: "Brasil",
                        latitude: a.latitude,
                        longitude: a.longitude,
                        google_place_id: a.google_place_id,
                      })
                    }
                    placeholder="Digite rua, número, cidade…"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confira e complete os campos abaixo — eles aparecem no seu perfil.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Logradouro</Label>
                    <Input
                      value={profile.street ?? ""}
                      onChange={(e) => updateProfile({ street: e.target.value })}
                      placeholder="Rua, avenida, quadra…"
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={profile.address_number ?? ""}
                      onChange={(e) => updateProfile({ address_number: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={profile.postal_code ?? ""}
                      onChange={(e) => updateProfile({ postal_code: e.target.value })}
                      placeholder="70000-000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Bairro</Label>
                    <Input
                      value={profile.neighborhood ?? ""}
                      onChange={(e) => updateProfile({ neighborhood: e.target.value })}
                      placeholder="Zona Industrial, Asa Sul…"
                    />
                  </div>
                </div>


                <div>
                  <Label>Região Administrativa (DF)</Label>
                  <DfRegionCombobox
                    value={profile.city ?? ""}
                    onChange={(name) =>
                      updateProfile({ city: name, state: "DF", country: "Brasil" })
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Atendemos exclusivamente o Distrito Federal — selecione sua RA oficial.
                  </p>
                </div>

                {profile.latitude && profile.longitude && (
                  <LocationMap
                    latitude={Number(profile.latitude)}
                    longitude={Number(profile.longitude)}
                    radiusKm={profile.service_radius_km ?? undefined}
                  />
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Complemento</Label>
                    <Input
                      value={profile.address_complement ?? ""}
                      maxLength={100}
                      onChange={(e) => updateProfile({ address_complement: e.target.value })}
                      placeholder="Sala 204, Bloco B, Loja 12…"
                    />
                  </div>
                  <div>
                    <Label>Ponto de referência</Label>
                    <Input
                      value={profile.address_reference ?? ""}
                      maxLength={140}
                      onChange={(e) => updateProfile({ address_reference: e.target.value })}
                      placeholder="Em frente à praça, ao lado do mercado…"
                    />
                  </div>
                  <div>
                    <Label>Raio de atendimento (km)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      value={profile.service_radius_km ?? ""}
                      onChange={(e) =>
                        updateProfile({
                          service_radius_km: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-white p-4">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Horário de funcionamento
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Horário de Brasília. Aparece no seu perfil com o selo “Aberto agora”.
                  </p>
                  <div className="mt-4">
                    <BusinessHoursSection
                      professionalId={profile.id}
                      holidayNote={profile.holiday_note ?? null}
                    />
                  </div>
                </div>


                <div>
                  <Label>O que exibir publicamente</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {VISIBILITY_OPTIONS.map((o) => {
                      const active = profile.public_address_visibility === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => updateProfile({ public_address_visibility: o.value })}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-white text-foreground hover:border-primary/40"
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Modalidade</Label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <BoolChip
                      label="Atendo no meu endereço"
                      value={!!profile.serves_at_business_address}
                      onChange={(v) => updateProfile({ serves_at_business_address: v })}
                    />
                    <BoolChip
                      label="Vou até o cliente"
                      value={!!profile.serves_at_customer_location}
                      onChange={(v) => updateProfile({ serves_at_customer_location: v })}
                    />
                    <BoolChip
                      label="Atendo online"
                      value={!!profile.serves_remotely}
                      onChange={(v) => updateProfile({ serves_remotely: v })}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && profile && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Portfólio & Presença digital</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fotos e redes sociais aumentam sua conversão em até 3x.
                  </p>
                </div>

                <div>
                  <Label>Foto de capa</Label>
                  <CoverUploader url={profile.cover_url} onFile={handleCoverUpload} busy={busy} />
                </div>

                <div>
                  <Label>Portfólio multimídia</Label>
                  <p className="mb-3 mt-1 text-xs text-muted-foreground">
                    Imagens, Reels do Instagram e vídeos do YouTube. Itens novos ficam pendentes até a aprovação do time.
                  </p>
                  <PortfolioManager professionalId={profile.id} professionalUserId={userId ?? profile.user_id} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="flex items-center gap-1.5">
                      <Instagram size={14} /> Instagram (@usuario)
                    </Label>
                    <Input
                      value={profile.instagram_username ?? ""}
                      maxLength={50}
                      onChange={(e) => {
                        const v = e.target.value.replace(/^@/, "").trim();
                        updateProfile({
                          instagram_username: v || null,
                          instagram_url: v ? `https://instagram.com/${v}` : null,
                        });
                      }}
                      placeholder="seuinstagram"
                    />
                  </div>
                  <div>
                    <Label>Site</Label>
                    <Input
                      value={profile.website_url ?? ""}
                      maxLength={255}
                      onChange={(e) => updateProfile({ website_url: e.target.value || null })}
                      placeholder="https://…"
                    />
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <Input
                      value={profile.facebook_url ?? ""}
                      maxLength={255}
                      onChange={(e) => updateProfile({ facebook_url: e.target.value || null })}
                      placeholder="https://facebook.com/…"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && profile && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Pronto para publicar?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Veja como seu perfil vai aparecer para os clientes.
                  </p>
                </div>
                <PreviewCard profile={profile} categoryNames={categories.filter((c) => selectedCategories.includes(c.id)).map((c) => c.name)} />
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                  Após publicar, você poderá continuar editando seu perfil no painel a qualquer momento.
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          {userId && (
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" onClick={goBack} disabled={step <= 1 || busy}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    toast.success("Rascunho salvo. Você pode voltar quando quiser.");
                    navigate({ to: "/painel" });
                  }}
                  disabled={busy}
                >
                  Salvar e sair
                </Button>
                {step < 5 ? (
                  <Button onClick={goNext} disabled={busy}>
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handlePublish} disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Publicar perfil
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

/* ---------------- helpers ---------------- */

function BoolChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        value
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-border bg-white text-muted-foreground hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}

function AvatarUploader({ url, onFile, busy }: { url: string; onFile: (f: File) => void; busy: boolean }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => ref.current?.click()}
      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition hover:border-primary"
    >
      {url ? (
        <img src={url} alt="avatar" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Camera size={20} />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[10px] font-medium text-white">
        {url ? "trocar" : "adicionar"}
      </span>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </button>
  );
}

function CoverUploader({ url, onFile, busy }: { url: string; onFile: (f: File) => void; busy: boolean }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => ref.current?.click()}
      className="relative mt-1.5 flex aspect-[16/6] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition hover:border-primary"
    >
      {url ? (
        <img src={url} alt="capa" className="h-full w-full object-cover" />
      ) : (
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ImagePlus size={18} /> Adicionar foto de capa
        </span>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </button>
  );
}

function UploadInline({
  children,
  onFile,
  disabled,
}: {
  children: React.ReactNode;
  onFile: (f: File) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} disabled={disabled}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </>
  );
}

function PreviewCard({
  profile,
  categoryNames,
}: {
  profile: OnboardingProfile;
  categoryNames: string[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-orange/20">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="-mt-10 flex items-end gap-4 px-5">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-muted">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="pb-2">
          <div className="text-lg font-semibold">{profile.professional_name || "Seu nome"}</div>
          <div className="text-xs text-muted-foreground">
            {profile.city && profile.state ? `${profile.city}/${profile.state}` : "Local não definido"}
          </div>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {profile.description || "Descreva sua atuação para os clientes verem aqui."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categoryNames.map((n) => (
            <Badge key={n} variant="secondary" className="text-[10px]">
              {n}
            </Badge>
          ))}
          {(profile.service_types ?? []).map((s) => (
            <Badge key={s} variant="outline" className="text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
