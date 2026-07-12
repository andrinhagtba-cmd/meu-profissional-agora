import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, Upload, User as UserIcon } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  addPortfolioItem,
  deletePortfolioItem,
  getMyProfessionalProfile,
  listPortfolio,
  uploadAvatar,
  uploadCover,
} from "@/services/professionalMediaService";

export const Route = createFileRoute("/_authenticated/painel/midia")({
  head: () => ({
    meta: [
      { title: "Mídia do perfil" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelMidia,
});

const MAX_MB = 8;

function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Envie um arquivo de imagem.";
  if (file.size > MAX_MB * 1024 * 1024) return `Tamanho máximo ${MAX_MB}MB.`;
  return null;
}

function PainelMidia() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["my-pro-profile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMyProfessionalProfile(user!.id),
  });

  const proId = profileQ.data?.id ?? null;

  const portfolioQ = useQuery({
    queryKey: ["my-portfolio", proId],
    enabled: !!proId,
    queryFn: () => listPortfolio(proId!),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["my-pro-profile", user?.id] });
    qc.invalidateQueries({ queryKey: ["my-portfolio", proId] });
  };

  const avatarMut = useMutation({
    mutationFn: (f: File) => uploadAvatar(user!.id, proId!, f),
    onSuccess: () => {
      toast.success("Foto de perfil atualizada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao enviar foto"),
  });

  const coverMut = useMutation({
    mutationFn: (f: File) => uploadCover(user!.id, proId!, f),
    onSuccess: () => {
      toast.success("Capa atualizada");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao enviar capa"),
  });

  const addMut = useMutation({
    mutationFn: (p: { title: string; file: File; description?: string }) =>
      addPortfolioItem(user!.id, proId!, p.title, p.file, p.description),
    onSuccess: () => {
      toast.success("Trabalho adicionado ao portfólio");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao adicionar"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deletePortfolioItem(id),
    onSuccess: () => {
      toast.success("Item removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao remover"),
  });

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const portfolioFileRef = useRef<HTMLInputElement>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const busy =
    avatarMut.isPending || coverMut.isPending || addMut.isPending || delMut.isPending;

  const noProfile = !loading && profileQ.data === null;

  const initials = useMemo(() => {
    const n = profileQ.data?.professional_name ?? user?.email ?? "?";
    return n.trim().slice(0, 2).toUpperCase();
  }, [profileQ.data, user]);

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Perfil profissional</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
              Foto, capa e portfólio
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Sua imagem na plataforma. Mantenha uma foto nítida, uma capa que represente
              seu trabalho e envie fotos de projetos recentes.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/painel">Voltar ao painel</Link>
          </Button>
        </div>

        {noProfile ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Sua conta ainda não tem perfil profissional. Fale com o suporte ou finalize
              seu cadastro como profissional para liberar esta seção.
            </p>
          </div>
        ) : (
          <>
            {/* Capa */}
            <section className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="relative h-40 w-full bg-secondary sm:h-56">
                {profileQ.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : profileQ.data?.cover_url ? (
                  <img
                    src={profileQ.data.cover_url}
                    alt="Capa do perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <span className="text-sm">Nenhuma capa enviada</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Recomendado: 1600×600 px, JPG/PNG, até {MAX_MB}MB.
                </div>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const err = validateImage(f);
                    if (err) return toast.error(err);
                    coverMut.mutate(f);
                  }}
                />
                <Button
                  className="rounded-xl"
                  onClick={() => coverRef.current?.click()}
                  disabled={busy || !proId}
                >
                  {coverMut.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                  Enviar capa
                </Button>
              </div>
            </section>

            {/* Avatar */}
            <section className="mt-6 rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-bold text-foreground">Foto de perfil</h2>
              <div className="mt-4 flex flex-wrap items-center gap-5">
                {profileQ.isLoading ? (
                  <Skeleton className="h-24 w-24 rounded-full" />
                ) : profileQ.data?.avatar_url ? (
                  <img
                    src={profileQ.data.avatar_url}
                    alt="Foto de perfil"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-24 w-24 place-items-center rounded-full bg-secondary text-2xl font-bold text-primary">
                    {initials || <UserIcon size={28} />}
                  </span>
                )}
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const err = validateImage(f);
                    if (err) return toast.error(err);
                    avatarMut.mutate(f);
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    className="rounded-xl"
                    onClick={() => avatarRef.current?.click()}
                    disabled={busy || !proId}
                  >
                    {avatarMut.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    Enviar foto
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Quadrada, mín. 400×400 px, até {MAX_MB}MB.
                  </p>
                </div>
              </div>
            </section>

            {/* Portfólio multimídia */}
            <section className="mt-6 rounded-3xl border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="font-display text-lg font-bold text-foreground">Portfólio profissional</h2>
                <p className="text-sm text-muted-foreground">
                  Envie imagens, Reels do Instagram ou vídeos do YouTube. Novos itens ficam pendentes de aprovação.
                </p>
              </div>
              {proId && (
                <PortfolioManager professionalId={proId} professionalUserId={user!.id} />
              )}
            </section>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
