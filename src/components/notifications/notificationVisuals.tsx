import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  MessageSquare,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Visual = { Icon: LucideIcon; wrapper: string; label: string };

const MAP: Record<string, Visual> = {
  message: { Icon: MessageSquare, wrapper: "bg-primary/10 text-primary", label: "Mensagem" },
  message_new: { Icon: MessageSquare, wrapper: "bg-primary/10 text-primary", label: "Mensagem" },
  proposal: { Icon: FileText, wrapper: "bg-accent/10 text-accent", label: "Proposta" },
  proposal_accepted: {
    Icon: CheckCircle2,
    wrapper: "bg-emerald-500/10 text-emerald-600",
    label: "Proposta aceita",
  },
  proposal_rejected: { Icon: XCircle, wrapper: "bg-destructive/10 text-destructive", label: "Proposta recusada" },
  quote_status: { Icon: FileText, wrapper: "bg-primary/10 text-primary", label: "Pedido" },
  opportunity: { Icon: Sparkles, wrapper: "bg-accent/10 text-accent", label: "Oportunidade" },
  review: { Icon: Star, wrapper: "bg-amber-500/10 text-amber-600", label: "Avaliação" },
  review_new: { Icon: Star, wrapper: "bg-amber-500/10 text-amber-600", label: "Avaliação" },
  moderation: { Icon: AlertTriangle, wrapper: "bg-amber-500/10 text-amber-600", label: "Moderação" },
  system: { Icon: Bell, wrapper: "bg-secondary text-muted-foreground", label: "Sistema" },
  info: { Icon: Bell, wrapper: "bg-secondary text-muted-foreground", label: "Informação" },
};

export function notificationVisual(type: string): Visual {
  return MAP[type] ?? MAP.info;
}

export function NotificationIcon({ type, size = 18 }: { type: string; size?: number }) {
  const { Icon, wrapper } = notificationVisual(type);
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${wrapper}`}
      aria-hidden="true"
    >
      <Icon size={size} />
    </span>
  );
}

export function relativeTime(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `há ${days}d`;
  return date.toLocaleDateString("pt-BR");
}
