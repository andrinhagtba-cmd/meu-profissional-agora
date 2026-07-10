import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { categories } from "@/data/categories";
import { searchProfessionals } from "@/services/mockApi";

interface BuscarSearch {
  servico?: string;
  cidade?: string;
  atendimento?: string;
  categoria?: string;
}

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>): BuscarSearch => ({
    servico: typeof search.servico === "string" ? search.servico : undefined,
    cidade: typeof search.cidade === "string" ? search.cidade : undefined,
    atendimento: typeof search.atendimento === "string" ? search.atendimento : undefined,
    categoria: typeof search.categoria === "string" ? search.categoria : undefined,
  }),
  component: BuscarPage,
});

const PAGE_SIZE = 8;

function BuscarPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/buscar" });

  const [servico, setServico] = useState(params.servico ?? "");
  const [cidade, setCidade] = useState(params.cidade ?? "");
  const [categoria, setCategoria] = useState(params.categoria ?? "todas");
  const [notaMinima, setNotaMinima] = useState(0);
  const [distancia, setDistancia] = useState(20);
  const [atendimento, setAtendimento] = useState(params.atendimento ?? "todos");
  const [verificado, setVerificado] = useState(false);
  const [precoMax, setPrecoMax] = useState(500);
  const [emergencial, setEmergencial] = useState(false);
  const [ordenar, setOrdenar] = useState("relevancia");
  const [pagina, setPagina] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(
    () => ({
      servico: params.servico,
      cidade: params.cidade,
      categoria,
      notaMinima: notaMinima || undefined,
      distancia,
      atendimento,
      verificado: verificado || undefined,
      precoMax,
      emergencial: emergencial || undefined,
      ordenar,
    }),
    [params.servico, params.cidade, categoria, notaMinima, distancia, atendimento, verificado, precoMax, emergencial, ordenar],
  );

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", filters],
    queryFn: () => searchProfessionals(filters),
  });

  const total = results?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(pagina, totalPages);
  const pageItems = results?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) ?? [];

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    navigate({
      search: {
        servico: servico || undefined,
        cidade: cidade || undefined,
        atendimento: atendimento !== "todos" ? atendimento : undefined,
        categoria: categoria !== "todas" ? categoria : undefined,
      },
    });
  };

  const clearFilters = () => {
    setServico("");
    setCidade("");
    setCategoria("todas");
    setNotaMinima(0);
    setDistancia(20);
    setAtendimento("todos");
    setVerificado(false);
    setPrecoMax(500);
    setEmergencial(false);
    setOrdenar("relevancia");
    setPagina(1);
    navigate({ search: {} });
  };

  const filtersPanel = (
    <div className="space-y-6">
      <div>
        <Label htmlFor="f-categoria" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Categoria
        </Label>
        <Select value={categoria} onValueChange={(v) => { setCategoria(v); setPagina(1); }}>
          <SelectTrigger id="f-categoria" className="mt-2 h-11! w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="f-nota" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Avaliação mínima: {notaMinima > 0 ? `${notaMinima.toFixed(1).replace(".", ",")}+` : "qualquer"}
        </Label>
        <Slider
          id="f-nota"
          value={[notaMinima]}
          onValueChange={([v]) => { setNotaMinima(v); setPagina(1); }}
          min={0}
          max={5}
          step={0.5}
          className="mt-3"
        />
      </div>

      <div>
        <Label htmlFor="f-distancia" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Distância: até {distancia} km
        </Label>
        <Slider
          id="f-distancia"
          value={[distancia]}
          onValueChange={([v]) => { setDistancia(v); setPagina(1); }}
          min={1}
          max={20}
          step={1}
          className="mt-3"
        />
      </div>

      <div>
        <Label htmlFor="f-preco" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Preço inicial: até R$ {precoMax}
        </Label>
        <Slider
          id="f-preco"
          value={[precoMax]}
          onValueChange={([v]) => { setPrecoMax(v); setPagina(1); }}
          min={50}
          max={500}
          step={10}
          className="mt-3"
        />
      </div>

      <div>
        <Label htmlFor="f-atendimento" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Tipo de atendimento
        </Label>
        <Select value={atendimento} onValueChange={(v) => { setAtendimento(v); setPagina(1); }}>
          <SelectTrigger id="f-atendimento" className="mt-2 h-11! w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="residencial">Residencial</SelectItem>
            <SelectItem value="empresarial">Empresarial</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
          <Checkbox checked={verificado} onCheckedChange={(v) => { setVerificado(v === true); setPagina(1); }} />
          Apenas verificados
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
          <Checkbox checked={emergencial} onCheckedChange={(v) => { setEmergencial(v === true); setPagina(1); }} />
          Atendimento emergencial
        </label>
      </div>

      <Button variant="outline" onClick={clearFilters} className="h-11 w-full rounded-xl border-border font-semibold">
        <X size={15} aria-hidden="true" />
        Limpar filtros
      </Button>
    </div>
  );

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        <div className="container-page py-6">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Buscar profissionais
          </h1>
          <form onSubmit={applySearch} className="mt-4 grid gap-3 sm:grid-cols-[1.5fr_1fr_auto]">
            <div className="relative">
              <label htmlFor="busca-servico" className="sr-only">O que você precisa?</label>
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="busca-servico"
                value={servico}
                onChange={(e) => setServico(e.target.value)}
                placeholder="O que você precisa?"
                className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="relative">
              <label htmlFor="busca-cidade" className="sr-only">Cidade</label>
              <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="busca-cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade ou estado"
                className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button type="submit" className="h-12 rounded-xl px-6 font-semibold">
              Buscar
            </Button>
          </form>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-5 font-display text-lg font-bold text-foreground">Filtros</h2>
            {filtersPanel}
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isLoading ? "Buscando..." : `${total} profissiona${total === 1 ? "l" : "is"} encontrado${total === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-xl border-border font-semibold lg:hidden"
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal size={15} aria-hidden="true" />
                Filtros
              </Button>
              <label htmlFor="ordenar" className="sr-only">Ordenar por</label>
              <Select value={ordenar} onValueChange={(v) => { setOrdenar(v); setPagina(1); }}>
                <SelectTrigger id="ordenar" className="h-11! w-48 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Mais relevantes</SelectItem>
                  <SelectItem value="avaliacao">Melhor avaliados</SelectItem>
                  <SelectItem value="proximidade">Mais próximos</SelectItem>
                  <SelectItem value="resposta">Resposta mais rápida</SelectItem>
                  <SelectItem value="preco">Menor preço</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtersOpen && (
            <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-card lg:hidden">
              {filtersPanel}
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-3xl" />
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card py-16 text-center">
              <Search size={36} className="mx-auto text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-bold text-foreground">
                Nenhum resultado encontrado
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Tente ampliar a distância, remover filtros ou buscar por outro serviço.
              </p>
              <Button onClick={clearFilters} variant="outline" className="mt-5 h-11 rounded-xl font-semibold">
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {pageItems.map((pro) => (
                  <ProfessionalCard key={pro.slug} pro={pro} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginação">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagina(i + 1)}
                      aria-current={safePage === i + 1 ? "page" : undefined}
                      className={`h-11 w-11 rounded-xl text-sm font-semibold transition-colors ${
                        safePage === i + 1
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
