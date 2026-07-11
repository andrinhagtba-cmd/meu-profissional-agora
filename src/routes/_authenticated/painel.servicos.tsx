import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  addMyService,
  getMyProProfile,
  listAllServices,
  listMyServices,
  removeMyService,
  toggleMyService,
} from "@/services/professionalDashboardService";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel/servicos")({
  head: () => ({
    meta: [
      { title: "Meus serviços — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: pro } = useQuery({
    queryKey: ["myProProfile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMyProProfile(user!.id),
  });

  const { data: mine, isLoading } = useQuery({
    queryKey: ["myServices", pro?.id],
    enabled: !!pro?.id,
    queryFn: () => listMyServices(pro!.id),
  });

  const { data: allServices } = useQuery({
    queryKey: ["allServices"],
    queryFn: listAllServices,
  });

  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<
    "to_quote" | "fixed" | "hourly" | "daily" | "per_visit"
  >("to_quote");
  const [description, setDescription] = useState("");

  const takenIds = useMemo(() => new Set((mine ?? []).map((s) => s.service_id)), [mine]);
  const available = useMemo(
    () => (allServices ?? []).filter((s) => !takenIds.has(s.id)),
    [allServices, takenIds],
  );

  const add = useMutation({
    mutationFn: async () => {
      if (!pro) throw new Error("Sem perfil profissional.");
      if (!serviceId) throw new Error("Selecione um serviço.");
      await addMyService({
        professional_id: pro.id,
        service_id: serviceId,
        starting_price: price ? Number(price.replace(",", ".")) : null,
        price_type: priceType,
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Serviço adicionado!");
      setOpen(false);
      setServiceId("");
      setPrice("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["myServices"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao adicionar serviço"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleMyService(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myServices"] }),
  });

  const remove = useMutation({
    mutationFn: removeMyService,
    onSuccess: () => {
      toast.success("Serviço removido.");
      qc.invalidateQueries({ queryKey: ["myServices"] });
    },
  });

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              <Link to="/painel" className="hover:text-primary">Painel</Link> · Serviços
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Meus serviços
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha os serviços que você oferece e defina seus preços iniciais.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="h-11 rounded-xl bg-orange px-5 font-semibold text-orange-foreground hover:bg-orange/90"
                disabled={!pro}
              >
                <Plus className="mr-2" size={16} /> Adicionar serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground">Serviço</label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {available.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.category?.name ? `${s.category.name} · ` : ""}
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-foreground">Preço inicial (R$)</label>
                    <Input
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Ex.: 120,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground">Tipo</label>
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
                  <label className="text-sm font-semibold text-foreground">Descrição (opcional)</label>
                  <Textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes sobre o serviço, escopo, materiais…"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => add.mutate()}
                  disabled={add.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {add.isPending ? "Adicionando…" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!pro ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-display text-lg font-bold text-foreground">
              Perfil profissional não encontrado
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete seu cadastro profissional para gerenciar serviços.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : mine && mine.length > 0 ? (
          <div className="grid gap-3">
            {mine.map((s) => (
              <article
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.service?.category?.name && (
                      <Badge variant="secondary" className="rounded-full">
                        {s.service.category.name}
                      </Badge>
                    )}
                    <p className="font-display text-base font-bold text-foreground">
                      {s.service?.name ?? "Serviço"}
                    </p>
                  </div>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.starting_price != null
                      ? `A partir de R$ ${Number(s.starting_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "Sob consulta"}{" "}
                    · {priceTypeLabel(s.price_type)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Switch
                      checked={s.active}
                      onCheckedChange={(checked) => toggle.mutate({ id: s.id, active: checked })}
                    />
                    {s.active ? "Ativo" : "Inativo"}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-600"
                    onClick={() => remove.mutate(s.id)}
                    aria-label="Remover serviço"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-display text-lg font-bold text-foreground">
              Você ainda não cadastrou serviços
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione os serviços que você oferece para aparecer nas buscas.
            </p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function priceTypeLabel(t: string | null) {
  switch (t) {
    case "fixed": return "Valor fixo";
    case "hourly": return "Por hora";
    case "daily": return "Por diária";
    case "per_visit": return "Por visita";
    default: return "Sob consulta";
  }
}
