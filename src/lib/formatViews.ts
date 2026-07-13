// Formatação BR de visualizações de perfil.
// compact=true → "1,2 mil" / "1,2 mi". compact=false → "1.247".

export function formatProfileViews(value: number | null | undefined, opts?: { compact?: boolean }): string {
  const n = Math.max(0, Math.floor(Number(value ?? 0)));
  if (opts?.compact) {
    if (n < 1000) return n.toLocaleString("pt-BR");
    if (n < 1_000_000) {
      const v = n / 1000;
      return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
    }
    const v = n / 1_000_000;
    return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  return n.toLocaleString("pt-BR");
}

export function formatViewsLabel(value: number | null | undefined, opts?: { compact?: boolean }): string {
  const n = Math.max(0, Math.floor(Number(value ?? 0)));
  const formatted = formatProfileViews(n, opts);
  return n === 1 ? `${formatted} visita` : `${formatted} visitas`;
}
