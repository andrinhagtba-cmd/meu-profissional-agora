import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  LocateFixed,
  MapPin,
  Search,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listSearchSuggestions,
  type SearchSuggestion,
} from "@/services/professionalService";

const tabs = [
  { id: "servicos", label: "Serviços", icon: Wrench },
  { id: "profissionais", label: "Profissionais", icon: Briefcase },
  { id: "empresas", label: "Empresas", icon: Building2 },
  { id: "orcamento", label: "Pedir orçamento", icon: ClipboardList },
] as const;

export function SearchPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("servicos");
  const [servico, setServico] = useState("");
  const [cidade, setCidade] = useState("");
  const [prazo, setPrazo] = useState("sem-urgencia");
  const [atendimento, setAtendimento] = useState("todos");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = servico.length > 0
    ? categories.filter((c) => c.name.toLowerCase().includes(servico.toLowerCase())).slice(0, 5)
    : [];

  const handleSearch = () => {
    if (tab === "orcamento") {
      navigate({ to: "/pedir-orcamento", search: { profissional: undefined, categoria: undefined, servico: undefined } });
      return;
    }
    navigate({
      to: "/buscar",
      search: {
        servico: servico || undefined,
        cidade: cidade || undefined,
        atendimento: atendimento !== "todos" ? atendimento : undefined,
      } as never,
    });
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl bg-card p-4 shadow-float sm:p-6" role="search">
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:gap-1" role="tablist" aria-label="Tipo de busca">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors sm:shrink-0 sm:px-4 ${
              tab === id
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon size={16} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
        <div className="relative min-w-0">
          <Label htmlFor="hero-servico" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            O que você precisa?
          </Label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="hero-servico"
              value={servico}
              onChange={(e) => {
                setServico(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Ex: Ótica, Guincho, Loja de Celular"
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-float">
              {suggestions.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary"
                    onMouseDown={() => {
                      setServico(c.name);
                      setShowSuggestions(false);
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          <Label htmlFor="hero-cidade" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Onde?
          </Label>
          <div className="relative">
            <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="hero-cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Cidade, bairro ou CEP"
              className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              aria-label="Usar minha localização atual"
              onClick={() => {
                setCidade("Curitiba");
                toast.success("Localização definida: Curitiba (simulada)");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-primary transition-colors hover:bg-secondary"
            >
              <LocateFixed size={16} />
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <Label htmlFor="hero-prazo" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Quando precisa?
          </Label>
          <Select value={prazo} onValueChange={setPrazo}>
            <SelectTrigger id="hero-prazo" className="h-12! w-full rounded-xl">
              <Calendar size={16} className="mr-1 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="esta-semana">Esta semana</SelectItem>
              <SelectItem value="data">Escolher uma data</SelectItem>
              <SelectItem value="sem-urgencia">Sem urgência</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <Label htmlFor="hero-atendimento" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Tipo de atendimento
          </Label>
          <Select value={atendimento} onValueChange={setAtendimento}>
            <SelectTrigger id="hero-atendimento" className="h-12! w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residencial">Residencial</SelectItem>
              <SelectItem value="empresarial">Empresarial</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleSearch} className="h-12 w-full rounded-xl px-7 font-semibold lg:w-auto">
            <Search size={17} aria-hidden="true" />
            Buscar agora
          </Button>
        </div>
      </div>
    </div>
  );
}
