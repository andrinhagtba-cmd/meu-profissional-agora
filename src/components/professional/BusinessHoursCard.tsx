import { Clock } from "lucide-react";
import {
  computeStatus,
  dayLabel,
  nowInBrasilia,
  WEEKDAY_LABEL,
  type BusinessHourDay,
} from "@/lib/businessHours";

export function OpenNowBadge({ week }: { week: BusinessHourDay[] }) {
  const status = computeStatus(week);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        status.open
          ? "bg-emerald-100 text-emerald-700"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-emerald-600" : "bg-destructive"}`}
        aria-hidden="true"
      />
      {status.open ? "Aberto agora" : "Fechado agora"}
    </span>
  );
}

export function BusinessHoursCard({
  week,
  holidayNote,
}: {
  week: BusinessHourDay[];
  holidayNote?: string | null;
}) {
  const status = computeStatus(week);
  const today = nowInBrasilia().weekday;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Clock size={18} className="text-primary" aria-hidden="true" />
          Horário de funcionamento
        </h2>
        <OpenNowBadge week={week} />
      </div>

      {status.nextLabel && (
        <p className="mt-2 text-sm text-muted-foreground">{status.nextLabel}</p>
      )}

      <ul className="mt-4 divide-y divide-border">
        {week.map((d) => (
          <li
            key={d.weekday}
            className={`flex items-center justify-between py-2 text-sm ${
              d.weekday === today ? "font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            <span>{WEEKDAY_LABEL[d.weekday]}</span>
            <span className={d.is_closed ? "text-destructive" : ""}>{dayLabel(d)}</span>
          </li>
        ))}
      </ul>

      {holidayNote && (
        <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
          {holidayNote}
        </p>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">Horários no fuso de Brasília (DF).</p>
    </section>
  );
}
