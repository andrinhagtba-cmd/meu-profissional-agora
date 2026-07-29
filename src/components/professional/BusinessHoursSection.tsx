import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessHoursEditor } from "@/components/shared/BusinessHoursEditor";
import {
  getBusinessHours,
  saveBusinessHours,
  saveHolidayNote,
} from "@/services/businessHoursService";
import type { BusinessHourDay } from "@/lib/businessHours";

/** Bloco de horário de funcionamento reutilizado no admin e no painel do profissional. */
export function BusinessHoursSection({
  professionalId,
  holidayNote,
}: {
  professionalId: string;
  holidayNote?: string | null;
}) {
  const qc = useQueryClient();
  const [week, setWeek] = useState<BusinessHourDay[] | null>(null);
  const [note, setNote] = useState(holidayNote ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["pro-hours-edit", professionalId],
    queryFn: () => getBusinessHours(professionalId),
  });

  useEffect(() => {
    if (data) setWeek(data);
  }, [data]);
  useEffect(() => {
    setNote(holidayNote ?? "");
  }, [holidayNote]);

  const save = useMutation({
    mutationFn: async () => {
      if (!week) return;
      await saveBusinessHours(professionalId, week);
      await saveHolidayNote(professionalId, note.trim() || null);
    },
    onSuccess: () => {
      toast.success("Horários salvos");
      qc.invalidateQueries({ queryKey: ["pro-hours-edit", professionalId] });
      qc.invalidateQueries({ queryKey: ["pro-hours", professionalId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !week) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <BusinessHoursEditor
        value={week}
        onChange={setWeek}
        holidayNote={note}
        onHolidayNoteChange={setNote}
      />
      <Button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="h-11 rounded-xl font-semibold"
      >
        <Save size={16} aria-hidden="true" />
        {save.isPending ? "Salvando…" : "Salvar horários"}
      </Button>
    </div>
  );
}
