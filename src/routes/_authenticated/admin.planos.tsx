import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listPlansAdmin, upsertPlan, deletePlan, togglePlanActive,
  type AdminPlan, type UpsertPlanInput,
} from "@/services/adminService";

export const Route = createFileRoute("/_authenticated/admin/planos")({
  head: () => ({ meta: [{ title: "Planos — Admin ${BRAND_PLACEHOLDER}" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminPlan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => listPlansAdmin(),
  });

  const upsertM = useMutation({
    mutationFn: (input: UpsertPlanInput) => upsertPlan(input),
    onSuccess: () => {
      toast.success("Plano salvo");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setEditing(null); setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      toast.success("Plano removido");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => togglePlanActive(v.id, v.active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<AdminPlan>[] = [
    {
      key: "name", header: "Plano", cell: (r) => (
        <div>
          <div className="flex items-center gap-2 font-semibold text-foreground">
            {r.name}
            {r.featured_profile && (
              <Badge className="bg-orange/10 text-orange ring-1 ring-orange/20">
                <Sparkles size={11} className="mr-1" />Destaque
              </Badge>
            )}
          </div>
          <div className="line-clamp-1 text-xs text-muted-foreground">{r.description ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "price", header: "Preço", cell: (r) => (
        <div>
          <div className="font-semibold text-foreground">{brl(Number(r.price))}</div>
          <div className="text-xs text-muted-foreground">
            {r.billing_period === "yearly" ? "por ano" : r.billing_period === "monthly" ? "por mês" : r.billing_period}
          </div>
        </div>
      ), className: "w-40",
    },
    {
      key: "limit", header: "Leads/mês", cell: (r) => (
        <span className="text-muted-foreground">{r.lead_limit ?? "Ilimitado"}</span>
      ), className: "w-32",
    },
    {
      key: "active", header: "Ativo", cell: (r) => (
        <Switch checked={r.active} onCheckedChange={(v) => toggleM.mutate({ id: r.id, active: v })} />
      ), className: "w-20",
    },
    {
      key: "actions", header: "", cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}><Trash2 size={14} className="text-destructive" /></Button>
        </div>
      ), className: "w-28 text-right",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Planos"
        description="Configure os planos de assinatura oferecidos aos profissionais."
        actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1" />Novo plano</Button>}
      />
      <AdminTable
        columns={columns} rows={data} isLoading={isLoading}
        rowKey={(r) => r.id} emptyText="Nenhum plano cadastrado."
      />

      <PlanDialog
        open={creating || !!editing}
        initial={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(input) => upsertM.mutate(input)}
        submitting={upsertM.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}". Assinaturas existentes podem ser afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteM.mutate(toDelete.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PlanDialog({
  open, initial, onClose, onSubmit, submitting,
}: {
  open: boolean; initial: AdminPlan | null;
  onClose: () => void; onSubmit: (i: UpsertPlanInput) => void; submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [period, setPeriod] = useState("monthly");
  const [leadLimit, setLeadLimit] = useState<string>("");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [featuresText, setFeaturesText] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDescription(initial?.description ?? "");
      setPrice(Number(initial?.price ?? 0));
      setPeriod(initial?.billing_period ?? "monthly");
      setLeadLimit(initial?.lead_limit != null ? String(initial.lead_limit) : "");
      setFeatured(initial?.featured_profile ?? false);
      setActive(initial?.active ?? true);
      setFeaturesText((initial?.features ?? []).join("\n"));
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar plano" : "Novo plano"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Profissional Pro" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div>
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="one_time">Único</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Leads por mês (vazio = ilimitado)</Label>
            <Input type="number" value={leadLimit} onChange={(e) => setLeadLimit(e.target.value)} placeholder="Ilimitado" />
          </div>
          <div>
            <Label>Benefícios (um por linha)</Label>
            <Textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={4}
              placeholder={"Perfil verificado\nSuporte prioritário\nSelo de destaque"}
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={featured} onCheckedChange={setFeatured} />
              <Label>Perfil em destaque</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Ativo</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={submitting || !name || !period}
            onClick={() =>
              onSubmit({
                id: initial?.id,
                name,
                description,
                price,
                billing_period: period,
                lead_limit: leadLimit.trim() === "" ? null : Number(leadLimit),
                featured_profile: featured,
                active,
                features: featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
              })
            }
          >Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
