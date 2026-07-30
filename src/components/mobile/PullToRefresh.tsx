import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";

const THRESHOLD = 72;
const MAX_PULL = 120;

/**
 * Pull-to-refresh nativo para telas mobile.
 * Só ativa quando a página está no topo e o gesto é vertical em dispositivos touch.
 */
export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: {
  onRefresh: () => Promise<unknown> | unknown;
  children: ReactNode;
  disabled?: boolean;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  const reset = useCallback(() => {
    startY.current = null;
    active.current = false;
    setPull(0);
  }, []);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    if (!("ontouchstart" in window)) return;

    const onStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0]?.clientY ?? null;
      active.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current || startY.current === null || refreshing) return;
      const delta = (e.touches[0]?.clientY ?? 0) - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        reset();
        return;
      }
      setPull(Math.min(MAX_PULL, delta * 0.5));
    };

    const onEnd = async () => {
      if (!active.current) return;
      const reached = pull >= THRESHOLD;
      active.current = false;
      startY.current = null;
      if (!reached) {
        setPull(0);
        return;
      }
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", reset);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [disabled, onRefresh, pull, refreshing, reset]);

  const visible = pull > 4 || refreshing;

  return (
    <div className="relative">
      <div
        aria-hidden={!visible}
        className="pointer-events-none absolute inset-x-0 -top-2 z-10 flex justify-center transition-opacity"
        style={{ opacity: visible ? 1 : 0, transform: `translateY(${Math.max(0, pull - 8)}px)` }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary shadow-lg">
          {refreshing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ArrowDown
              size={18}
              className="transition-transform"
              style={{ transform: `rotate(${pull >= THRESHOLD ? 180 : 0}deg)` }}
            />
          )}
        </span>
      </div>
      <div
        style={{ transform: `translateY(${pull}px)` }}
        className={pull ? "" : "transition-transform duration-200"}
      >
        {children}
      </div>
    </div>
  );
}
