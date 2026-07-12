import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateMyProfile, uploadClientAvatar } from "@/services/clientService";
import { DfRegionCombobox } from "@/components/shared/DfRegionCombobox";
import { isValidDfRegion } from "@/data/dfRegions";

export const Route = createFileRoute("/_authenticated/painel/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeuPerfil,
});

function MeuPerfil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const avatar = useMutation({
    mutationFn: (file: File) => uploadClientAvatar(user!.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
      toast.success("Foto do perfil atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const initials = (form.full_name || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <p className="text-sm text-muted-foreground">
          <Link to="/painel" className="hover:text-primary">← Voltar ao painel</Link>
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Meu perfil
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Esses dados são usados nos seus pedidos e para o profissional entrar em contato.
            </p>
          </div>
          <Button asChild variant="outline" className="h-11 rounded-xl border-border font-semibold">
            <Link to="/painel/notificacoes">Ver notificações</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="mx-auto h-32 w-32 rounded-full" />
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            ) : (
              <div className="text-center">
                <div className="relative mx-auto h-32 w-32">
                  <Avatar className="h-32 w-32 border-4 border-secondary shadow-card">
                    <AvatarImage src={data?.avatar_url ?? undefined} alt={form.full_name || "Foto do perfil"} />
                    <AvatarFallback className="bg-secondary text-3xl font-bold text-primary">
                      {initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatar.isPending}
                    aria-label="Trocar foto do perfil"
                    className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {avatar.isPending ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) avatar.mutate(file);
                    event.currentTarget.value = "";
                  }}
                />
                <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">
                  {form.full_name || "Seu nome"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{data?.email ?? user?.email}</p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatar.isPending}
                  className="mt-5 h-11 rounded-xl px-5 font-semibold"
                >
                  {avatar.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Trocar foto
                </Button>
                <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-left text-xs leading-relaxed text-muted-foreground">
                  Use uma foto clara, centralizada e em formato JPG, PNG ou WebP até 5 MB.
                </div>
              </div>
            )}
          </aside>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
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
      </div>
    </SiteLayout>
  );
}
