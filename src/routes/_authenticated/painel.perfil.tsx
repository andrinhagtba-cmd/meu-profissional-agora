import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateMyProfile } from "@/services/clientService";

export const Route = createFileRoute("/_authenticated/painel/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeuPerfil,
});

function MeuPerfil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMyProfile(user!.id),
  });

  const [form, setForm] = useState({ full_name: "", phone: "", city: "", state: "" });

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateMyProfile(user!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
      toast.success("Perfil atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SiteLayout>
      <div className="container-page max-w-2xl py-10 lg:py-14">
        <p className="text-sm text-muted-foreground">
          <Link to="/painel" className="hover:text-primary">← Voltar ao painel</Link>
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
          Meu perfil
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esses dados são usados nos seus pedidos e para o profissional entrar em contato.
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
              className="space-y-5"
            >
              <div>
                <Label htmlFor="p-nome" className="font-semibold">Nome completo</Label>
                <Input
                  id="p-nome"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="p-email" className="font-semibold">E-mail</Label>
                <Input
                  id="p-email"
                  value={data?.email ?? user?.email ?? ""}
                  disabled
                  className="mt-2 h-12 rounded-xl bg-muted"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Alteração de e-mail em breve.
                </p>
              </div>
              <div>
                <Label htmlFor="p-phone" className="font-semibold">WhatsApp</Label>
                <Input
                  id="p-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(11) 98888-7777"
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
                <div>
                  <Label htmlFor="p-city" className="font-semibold">Cidade</Label>
                  <Input
                    id="p-city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="p-state" className="font-semibold">Estado</Label>
                  <Input
                    id="p-state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })}
                    maxLength={2}
                    className="mt-2 h-12 rounded-xl uppercase"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={save.isPending}
                className="h-12 rounded-xl px-6 font-semibold"
              >
                {save.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Salvando…
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
