import { useRef, useState, type ReactNode } from "react";

const ACTION_WIDTH = 96;
const TRIGGER = 64;

export type SwipeAction = {
  label: string;
  icon: ReactNode;
  onAction: () => void;
  tone?: "primary" | "accent" | "muted";
};

const toneClass: Record<NonNullable<SwipeAction["tone"]>, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  muted: "bg-secondary text-muted-foreground",
};

/**
 * Linha com gesto de swipe (mobile) revelando uma ação à esquerda e/ou direita.
 * No desktop o conteúdo permanece intacto e as ações continuam acessíveis por botões.
 */
export function SwipeableRow({
  children,
  left,
  right,
  className = "",
}: {
  children: ReactNode;
  left?: SwipeAction;
  right?: SwipeAction;
  className?: string;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"x" | "y" | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    axis.current = null;
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!axis.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (axis.current !== "x") return;
    if (dx > 0 && !left) return;
    if (dx < 0 && !right) return;
    setOffset(Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, dx)));
  };

  const onTouchEnd = () => {
    setDragging(false);
    if (offset >= TRIGGER && left) left.onAction();
    else if (offset <= -TRIGGER && right) right.onAction();
    setOffset(0);
    axis.current = null;
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {left && (
        <div
          className={`absolute inset-y-0 left-0 flex w-24 flex-col items-center justify-center gap-1 text-[11px] font-bold ${toneClass[left.tone ?? "primary"]}`}
          aria-hidden="true"
        >
          {left.icon}
          {left.label}
        </div>
      )}
      {right && (
        <div
          className={`absolute inset-y-0 right-0 flex w-24 flex-col items-center justify-center gap-1 text-[11px] font-bold ${toneClass[right.tone ?? "muted"]}`}
          aria-hidden="true"
        >
          {right.icon}
          {right.label}
        </div>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          setDragging(false);
          setOffset(0);
        }}
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative ${dragging ? "" : "transition-transform duration-200"}`}
      >
        {children}
      </div>
    </div>
  );
}
