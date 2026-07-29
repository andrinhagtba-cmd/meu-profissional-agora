import { useEffect, useState } from "react";
import { Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyWeek,
  WEEKDAY_LABEL,
  type BusinessHourDay,
} from "@/lib/businessHours";

type Props = {
  value: BusinessHourDay[] | null | undefined;
  onChange: (week: BusinessHourDay[]) => void;
  holidayNote?: string | null;
  onHolidayNoteChange?: (v: string) => void;
};

export function BusinessHoursEditor({ value, onChange, holidayNote, onHolidayNoteChange }: Props) {
  const [week, setWeek] = useState<BusinessHourDay[]>(value?.length ? value : emptyWeek());

  useEffect(() => {
    if (value?.length) setWeek(value);
  }, [value]);

  const update = (weekday: number, patch: Partial<BusinessHourDay>) => {
    const next = week.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d));
    setWeek(next);
    onChange(next);
  };

  const copyToAll = (weekday: number) => {
    const src = week.find((d) => d.weekday === weekday);
    if (!src) return;
    const next = week.map((d) => ({ ...src, weekday: d.weekday }));
    setWeek(next);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Clock size={16} className="text-primary" aria-hidden="true" />
        Horário de funcionamento
        <span className="text-xs font-normal text-muted-foreground">(horário de Brasília)</span>
      </div>

      <div className="space-y-2">
        {week.map((d) => (
          <div
            key={d.weekday}
            className="rounded-2xl border border-border bg-card p-3 sm:p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">
                {WEEKDAY_LABEL[d.weekday]}
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={!d.is_closed}
                    onCheckedChange={(v) => update(d.weekday, { is_closed: !v })}
                    aria-label={`Aberto em ${WEEKDAY_LABEL[d.weekday]}`}
                  />
                  {d.is_closed ? "Fechado" : "Aberto"}
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={d.is_24h}
                    disabled={d.is_closed}
                    onCheckedChange={(v) => update(d.weekday, { is_24h: v })}
                    aria-label={`24 horas em ${WEEKDAY_LABEL[d.weekday]}`}
                  />
                  24 horas
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => copyToAll(d.weekday)}
                >
                  <Copy size={13} aria-hidden="true" />
                  Copiar para todos
                </Button>
              </div>
            </div>

            {!d.is_closed && !d.is_24h && (
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div>
                  <Label className="text-xs">Abre</Label>
                  <Input
                    type="time"
                    value={d.open_time ?? ""}
                    onChange={(e) => update(d.weekday, { open_time: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Fecha</Label>
                  <Input
                    type="time"
                    value={d.close_time ?? ""}
                    onChange={(e) => update(d.weekday, { close_time: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Pausa (início)</Label>
                  <Input
                    type="time"
                    value={d.break_start ?? ""}
                    onChange={(e) => update(d.weekday, { break_start: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Pausa (fim)</Label>
                  <Input
                    type="time"
                    value={d.break_end ?? ""}
                    onChange={(e) => update(d.weekday, { break_end: e.target.value || null })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {onHolidayNoteChange && (
        <div>
          <Label className="text-xs">Feriados (observação exibida no perfil)</Label>
          <Textarea
            rows={2}
            maxLength={200}
            value={holidayNote ?? ""}
            onChange={(e) => onHolidayNoteChange(e.target.value)}
            placeholder="Ex.: Em feriados, atendimento das 9h às 13h mediante agendamento."
          />
        </div>
      )}
    </div>
  );
}
