import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSlugAvailable, slugify, suggestSlugs } from "@/services/slugService";

type Props = {
  /** Nome base (empresa ou profissional) usado para gerar o slug. */
  baseName: string;
  value: string;
  profileId?: string | null;
  onChange: (slug: string) => void;
  /** Gera automaticamente na primeira vez em que houver nome e o slug estiver vazio. */
  autoGenerate?: boolean;
};

/** Campo de endereço público (slug) com verificação de disponibilidade e sugestões. */
export function SlugField({ baseName, value, profileId, onChange, autoGenerate = true }: Props) {
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken" | "invalid">("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const autoDone = useRef(false);

  const generate = useCallback(async () => {
    const base = slugify(baseName);
    if (base.length < 3) return;
    setGenerating(true);
    try {
      const list = await suggestSlugs(base, profileId);
      setSuggestions(list);
      if (list[0]) onChange(list[0]);
    } catch {
      onChange(base);
    } finally {
      setGenerating(false);
    }
  }, [baseName, profileId, onChange]);

  // Geração automática na primeira vez
  useEffect(() => {
    if (!autoGenerate || autoDone.current) return;
    if (value || slugify(baseName).length < 3) return;
    autoDone.current = true;
    void generate();
  }, [autoGenerate, baseName, value, generate]);

  // Verificação com debounce
  useEffect(() => {
    const clean = slugify(value);
    if (!value) {
      setStatus("idle");
      return;
    }
    if (clean.length < 3) {
      setStatus("invalid");
      return;
    }
    setStatus("checking");
    const t = window.setTimeout(async () => {
      try {
        const free = await isSlugAvailable(clean, profileId);
        setStatus(free ? "free" : "taken");
        if (!free) {
          try {
            setSuggestions(await suggestSlugs(clean, profileId));
          } catch {
            /* noop */
          }
        }
      } catch {
        setStatus("idle");
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [value, profileId]);

  return (
    <div>
      <Label>Endereço público (URL do seu perfil)</Label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center rounded-xl border border-input bg-background pl-3">
          <span className="whitespace-nowrap text-xs text-muted-foreground">/profissional/</span>
          <Input
            value={value}
            maxLength={60}
            onChange={(e) => onChange(slugify(e.target.value))}
            placeholder="minha-empresa"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <span className="pr-3">
            {status === "checking" && <Loader2 size={15} className="animate-spin text-muted-foreground" />}
            {status === "free" && <Check size={15} className="text-emerald-600" />}
            {(status === "taken" || status === "invalid") && <X size={15} className="text-destructive" />}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void generate()}
          disabled={generating || slugify(baseName).length < 3}
          className="h-10 shrink-0 rounded-xl"
        >
          {generating ? (
            <Loader2 size={15} className="mr-2 animate-spin" />
          ) : (
            <RefreshCw size={15} className="mr-2" />
          )}
          Gerar automaticamente
        </Button>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {status === "free" && "Disponível — este endereço é só seu."}
        {status === "taken" && "Este endereço já está em uso. Escolha uma das sugestões abaixo."}
        {status === "invalid" && "Use pelo menos 3 caracteres (letras, números e hífen)."}
        {(status === "idle" || status === "checking") &&
          "Gerado a partir do nome da empresa. Você pode personalizar."}
      </p>

      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions
            .filter((s) => s !== value)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary/50 hover:text-primary"
              >
                {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
