import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyProProfile,
  listOpenLeads,
  submitProposal,
  type Lead,
} from "@/services/professionalDashboardService";
import { Briefcase, Clock, MapPin, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel/leads")({
  head: () => ({
    meta: [
      { title: "Leads disponíveis — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsPage,
});

const urgencyLabel: Record<string, string> = {
  hoje: "Urgente — hoje",
  "esta-semana": "Esta semana",
  data: "Data marcada",
  "sem-urgencia": "Sem pressa",
};

function LeadsPage() {
  const { user } = useAuth();

  const { data: pro } = useQuery({
    queryKey: ["myProProfile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMyProProfile(user!.id),
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["openLeads"],
    queryFn: listOpenLeads,
  });

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              <Link to="/painel" className="hover:text-primary">Painel</Link> · Leads
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Leads disponíveis
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pedidos abertos que você pode enviar propostas.
            </p>
          </div>
        </div>

        {!pro && !isLoading ? (
          <EmptyState
            title="Perfil profissional não encontrado"
            desc="Complete seu cadastro profissional para receber leads."
          />
        ) : isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : leads && leads.length > 0 ? (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} professionalId={pro?.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum lead disponível no momento"
            desc="Assim que novos pedidos forem publicados, aparecerão aqui."
          />
        )}
      </div>
    </SiteLayout>
  );
}

function LeadCard({ lead, professionalId }: { lead: Lead; professionalId?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"to_quote" | "fixed" | "hourly" | "daily" | "per_visit">(
    "to_quote",
  );
  const [deadline, setDeadline] = useState("");

  const qc = useQueryClient();
  const send = useMutation({
    mutationFn: async () => {
      if (!professionalId) throw new Error("Sem perfil profissional.");
      if (message.trim().length < 10)
        throw new Error("Descreva sua proposta com mais detalhes (mín. 10 caracteres).");
      return submitProposal({
        quote_request_id: lead.id,
        professional_id: professionalId,
        message: message.trim(),
        estimated_price: price ? Number(price.replace(",", ".")) : null,
        price_type: priceType,
        estimated_deadline: deadline || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Proposta enviada!");
      setOpen(false);
      setMessage("");
      setPrice("");
      setDeadline("");
      qc.invalidateQueries({ queryKey: ["myProposals"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao enviar proposta"),
  });

  return (
    <article className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {lead.category?.name && (
              <Badge variant="secondary" className="rounded-full">
                {lead.category.name}
              </Badge>
            )}
            <Badge className="rounded-full bg-orange text-orange-foreground hover:bg-orange">
              {urgencyLabel[lead.urgency] ?? lead.urgency}
            </Badge>
          </div>
          <h2 className="mt-2 font-display text-xl font-bold text-foreground">{lead.title}</h2>
          {lead.description && (
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{lead.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {lead.neighborhood ? `${lead.neighborhood}, ` : ""}
              {lead.city}/{lead.state}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={14} /> {new Date(lead.created_at).toLocaleDateString("pt-BR")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase size={14} /> {lead.service_type}
            </span>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
              <Send className="mr-2" size={16} /> Enviar proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova proposta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground">Mensagem ao cliente</label>
                <Textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Apresente-se, tire dúvidas e conte como pretende executar o serviço."
                  className="mt-1"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-foreground">Valor estimado (R$)</label>
                  <Input
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex.: 350,00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Tipo de preço</label>
                  <Select value={priceType} onValueChange={(v) => setPriceType(v as typeof priceType)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to_quote">Sob consulta</SelectItem>
                      <SelectItem value="fixed">Valor fixo</SelectItem>
                      <SelectItem value="hourly">Por hora</SelectItem>
                      <SelectItem value="daily">Por diária</SelectItem>
                      <SelectItem value="per_visit">Por visita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Prazo estimado (opcional)</label>
                <Input
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Ex.: começo em 2 dias, 1 semana de execução"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => send.mutate()}
                disabled={send.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {send.isPending ? "Enviando…" : "Enviar proposta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <p className="font-display text-lg font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
