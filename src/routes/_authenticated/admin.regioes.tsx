import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building, MapPin, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/regioes")({
  head: () => ({
    meta: [
      { title: "Regiões — Admin ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Row = {
  state: string;
  city: string;
  neighborhood: string | null;
  radius_km: number | null;
  professional: { id: string; professional_name: string | null; business_name: string | null } | null;
};

async function loadRegions(): Promise<Row[]> {
  const { data, error } = await supabase
    .from("service_areas")
    .select(
      `state, city, neighborhood, radius_km,
       professional:professional_id(id, professional_name, business_name)`,
    )
    .order("state")
    .order("city")
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-regions"], queryFn: loadRegions });
  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    if (!data) return { states: 0, cities: 0, pros: 0 };
    const states = new Set<string>();
    const cities = new Set<string>();
    const pros = new Set<string>();
    data.forEach((r) => {
      states.add(r.state);
      cities.add(`${r.state}::${r.city}`);
      if (r.professional?.id) pros.add(r.professional.id);
    });
    return { states: states.size, cities: cities.size, pros: pros.size };
  }, [data]);

  const grouped = useMemo(() => {
    if (!data) return [] as { state: string; cities: { name: string; pros: number; neighborhoods: Set<string> }[] }[];
    const term = q.trim().toLowerCase();
    const map = new Map<string, Map<string, { pros: Set<string>; nbs: Set<string> }>>();
    data.forEach((r) => {
      if (
        term &&
        !r.state.toLowerCase().includes(term) &&
        !r.city.toLowerCase().includes(term) &&
        !(r.neighborhood ?? "").toLowerCase().includes(term)
      )
        return;
      const cityMap = map.get(r.state) ?? new Map();
      const entry = cityMap.get(r.city) ?? { pros: new Set<string>(), nbs: new Set<string>() };
      if (r.professional?.id) entry.pros.add(r.professional.id);
      if (r.neighborhood) entry.nbs.add(r.neighborhood);
      cityMap.set(r.city, entry);
      map.set(r.state, cityMap);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, cm]) => ({
        state,
        cities: Array.from(cm.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, v]) => ({ name, pros: v.pros.size, neighborhoods: v.nbs })),
      }));
  }, [data, q]);

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-[oklch(0.93_0.014_258)] bg-gradient-to-br from-[oklch(0.98_0.012_258)] via-white to-[oklch(0.97_0.03_60)] p-6 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%),0_24px_60px_-32px_oklch(0.51_0.245_262/18%)] sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/15 backdrop-blur">
              <MapPin size={12} /> Cobertura geográfica
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Regiões atendidas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Visualize onde seus profissionais atendem, identifique praças com baixa cobertura e planeje expansões.
            </p>
          </div>
          <div className="flex gap-3">
            <Stat icon={<MapPin size={14} />} label="Estados" value={stats.states} />
            <Stat icon={<Building size={14} />} label="Cidades" value={stats.cities} />
            <Stat icon={<Users size={14} />} label="Profissionais" value={stats.pros} accent />
          </div>
        </div>
        <div className="relative mt-6 flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-sm ring-1 ring-[oklch(0.93_0.014_258)]">
          <Search size={16} className="text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por estado, cidade ou bairro…"
            className="h-9 border-none bg-transparent p-0 focus-visible:ring-0"
          />
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-[oklch(0.9_0.02_258)] bg-card px-6 py-16 text-center">
          <MapPin size={40} className="text-muted-foreground/50" />
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">Nenhuma região cadastrada</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            As áreas de atendimento aparecem aqui quando os profissionais completam seus perfis.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ state, cities }) => (
            <section key={state}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <MapPin size={12} />
                </span>
                {state}
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  {cities.length} cidades
                </span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {cities.map((c) => (
                  <article
                    key={c.name}
                    className="rounded-2xl border border-[oklch(0.93_0.014_258)] bg-card p-4 shadow-[0_1px_2px_oklch(0.51_0.245_262/4%)] transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display font-bold text-foreground">{c.name}</h3>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{state}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <Users size={11} /> {c.pros}
                      </span>
                    </div>
                    {c.neighborhoods.size > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {Array.from(c.neighborhoods)
                          .slice(0, 6)
                          .map((n) => (
                            <span
                              key={n}
                              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground"
                            >
                              {n}
                            </span>
                          ))}
                        {c.neighborhoods.size > 6 && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            +{c.neighborhoods.size - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-center ring-1 backdrop-blur ${
        accent
          ? "bg-primary/95 text-white ring-primary/40 shadow-lg shadow-primary/25"
          : "bg-white/80 text-foreground ring-[oklch(0.93_0.014_258)]"
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide">
        <span className={accent ? "text-white/80" : "text-muted-foreground"}>{icon}</span>
        <span className={accent ? "text-white/80" : "text-muted-foreground"}>{label}</span>
      </div>
      <div className="mt-1 font-display text-2xl font-extrabold leading-none">{value}</div>
    </div>
  );
}
