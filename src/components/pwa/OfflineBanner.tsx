import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const { online } = useOnlineStatus();
  if (online) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[80] bg-orange px-4 py-2 text-center text-xs font-semibold text-orange-foreground shadow-card"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      role="alert"
    >
      <span className="inline-flex items-center gap-2">
        <WifiOff size={14} /> Você está sem conexão. Algumas ações só funcionam online.
      </span>
    </div>
  );
}
