import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { submitProposal } from "@/services/mockApi";
import type { QuoteRequest } from "@/types";

export function ProposalModal({
  request,
  open,
  onOpenChange,
}: {
  request: QuoteRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [value, setValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (message.trim().length < 10) next.message = "Descreva sua proposta com pelo menos 10 caracteres.";
    if (!value.trim()) next.value = "Informe um valor estimado.";
    if (!deadline.trim()) next.deadline = "Informe um prazo.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    await submitProposal({ message, value, deadline });
    setSending(false);
    onOpenChange(false);
    setMessage("");
    setValue("");
    setDeadline("");
    toast.success("Proposta enviada com sucesso!", {
      description: "O cliente será notificado e poderá entrar em contato. (demonstração)",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Enviar proposta</DialogTitle>
          <DialogDescription>
            {request ? `${request.category} · ${request.city}, ${request.state}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="proposta-msg">Mensagem para o cliente</Label>
            <Textarea
              id="proposta-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explique como você pode ajudar, sua experiência e o que está incluso..."
              rows={4}
              className="mt-1.5 rounded-xl"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "proposta-msg-erro" : undefined}
            />
            {errors.message && (
              <p id="proposta-msg-erro" className="mt-1 text-xs text-destructive">
                {errors.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="proposta-valor">Valor estimado (R$)</Label>
              <Input
                id="proposta-valor"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ex.: 250"
                inputMode="decimal"
                className="mt-1.5 h-12 rounded-xl"
                aria-invalid={!!errors.value}
                aria-describedby={errors.value ? "proposta-valor-erro" : undefined}
              />
              {errors.value && (
                <p id="proposta-valor-erro" className="mt-1 text-xs text-destructive">
                  {errors.value}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="proposta-prazo">Prazo</Label>
              <Input
                id="proposta-prazo"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Ex.: amanhã à tarde"
                className="mt-1.5 h-12 rounded-xl"
                aria-invalid={!!errors.deadline}
                aria-describedby={errors.deadline ? "proposta-prazo-erro" : undefined}
              />
              {errors.deadline && (
                <p id="proposta-prazo-erro" className="mt-1 text-xs text-destructive">
                  {errors.deadline}
                </p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={sending} className="h-12 w-full rounded-xl font-semibold">
            {sending ? "Enviando..." : "Enviar proposta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
