import { Construction } from "lucide-react";

export function AdminComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <Construction className="mx-auto mb-3 text-orange" size={32} />
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {description ?? "Este módulo será liberado nas próximas etapas do painel administrativo."}
      </p>
    </div>
  );
}
