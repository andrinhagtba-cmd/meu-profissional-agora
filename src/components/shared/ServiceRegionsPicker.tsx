import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SERVICE_REGION_GROUPS } from "@/data/dfRegions";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

/** Seletor de áreas atendidas: RAs do DF, bairros de Brasília e Entorno. */
export function ServiceRegionsPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = norm(query);
    return SERVICE_REGION_GROUPS.map((g) => ({
      ...g,
      regions: !q
        ? g.regions
        : g.regions.filter(
            (r) =>
              norm(r.name).includes(q) ||
              norm(r.slug).includes(q) ||
              r.aliases.some((a) => norm(a).includes(q)),
          ),
    })).filter((g) => g.regions.length > 0);
  }, [query]);

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((x) => x !== name) : [...value, name]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar região, bairro ou setor (ex: Asa Sul, Taguatinga)"
          className="h-11 rounded-xl pl-9"
        />
      </div>

      <div className="max-h-[22rem] space-y-4 overflow-y-auto rounded-2xl border border-border/70 bg-background/60 p-3">
        {groups.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">Nenhuma área encontrada.</p>
        )}
        {groups.map((g) => {
          const names = g.regions.map((r) => r.name);
          const allSelected = names.every((n) => value.includes(n));
          return (
            <div key={g.label}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {g.label}
                </span>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-primary hover:underline"
                  onClick={() =>
                    onChange(
                      allSelected
                        ? value.filter((v) => !names.includes(v))
                        : Array.from(new Set([...value, ...names])),
                    )
                  }
                >
                  {allSelected ? "Limpar grupo" : "Selecionar todas"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.regions.map((r) => {
                  const active = value.includes(r.name);
                  return (
                    <button
                      key={`${g.label}-${r.slug}`}
                      type="button"
                      onClick={() => toggle(r.name)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {active && <Check size={12} />}
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          {value.length === 0
            ? "Nenhuma área selecionada"
            : `${value.length} área${value.length > 1 ? "s" : ""} selecionada${value.length > 1 ? "s" : ""}`}
        </span>
        {value.length > 0 && (
          <button type="button" className="font-semibold text-primary" onClick={() => onChange([])}>
            Limpar tudo
          </button>
        )}
      </div>
    </div>
  );
}
