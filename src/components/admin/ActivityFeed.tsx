import { UserPlus, ClipboardList, MessageSquare, Star, Flag } from "lucide-react";
import type { AdminActivity } from "@/services/adminService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const META = {
  signup: { icon: UserPlus, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  quote: { icon: ClipboardList, tone: "bg-primary/10 text-primary" },
  proposal: { icon: MessageSquare, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  review: { icon: Star, tone: "bg-orange/10 text-orange" },
  report: { icon: Flag, tone: "bg-destructive/10 text-destructive" },
} as const;

export function ActivityFeed({ items }: { items: AdminActivity[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhuma atividade recente.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => {
        const m = META[a.type];
        const Icon = m.icon;
        return (
          <li key={a.id} className="flex items-start gap-3 py-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${m.tone}`}>
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">{a.title}</div>
              <div className="truncate text-xs text-muted-foreground">{a.subtitle}</div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(a.at), { addSuffix: true, locale: ptBR })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
