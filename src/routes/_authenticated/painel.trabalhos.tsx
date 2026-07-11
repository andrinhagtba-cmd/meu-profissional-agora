import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Briefcase, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getMyProProfile } from "@/services/professionalDashboardService";
import { getOrCreateConversation } from "@/services/chatService";
import { TrackingSection } from "@/components/painel/TrackingSection";

export const Route = createFileRoute("/_authenticated/painel/trabalhos")({
  head: () => ({
    meta: [
      { title: "Meus trabalhos — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrabalhosPage,
});

const STATUS_LABEL: Record<string, string> = {
  professional_selected: "Selecionado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

type Job = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  state: string;
  neighborhood: string | null;
  status: string;
  created_at: string;
  client_id: string;
};

async function listMyJobs(proId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, title, description, city, state, neighborhood, status, created_at, client_id")
    .eq("selected_professional_id", proId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Job[];
}

function TrabalhosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: pro } = useQuery({
    queryKey: ["myProProfile", user?.id],
    enabled: !!user?.id,
    queryFn: () => getMyProProfile(user!.id),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pro-jobs", pro?.id],
    enabled: !!pro?.id,
    queryFn: () => listMyJobs(pro!.id),
  });

  const openChat = async (quoteId: string) => {
    if (!pro?.id) return;
    try {
      const convId = await getOrCreateConversation(quoteId, pro.id);
      navigate({ to: "/painel/mensagens/$id", params: { id: convId } });
    } catch (e) {
      toast.error((e as Error).message ?? "Erro ao abrir chat");
    }
  };

  return (
    <SiteLayout>
      <div className="container-page py-10 lg:py-14">
        <p className="text-sm text-muted-foreground">
          <Link to="/painel" className="hover:text-primary">
            <ArrowLeft size={12} className="mr-1 inline" />
            Voltar ao painel
          </Link>
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
          Meus trabalhos
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe os pedidos em que você foi selecionado — atualize o status para o cliente.
        </p>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center">
            <Briefcase className="mx-auto text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Ainda sem trabalhos aceitos. Envie propostas em <Link to="/painel/leads" className="text-primary underline">leads abertos</Link>.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {data.map((j) => {
              const isOpen = openId === j.id;
              return (
                <li key={j.id} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full text-[11px]">
                          {STATUS_LABEL[j.status] ?? j.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(j.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-lg font-bold text-foreground">{j.title}</h2>
                      {j.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} className="text-primary" />
                          {j.neighborhood ? `${j.neighborhood}, ` : ""}
                          {j.city}/{j.state}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={12} className="text-primary" />
                          {new Date(j.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => openChat(j.id)}>
                        Abrir chat
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                        onClick={() => setOpenId(isOpen ? null : j.id)}
                      >
                        {isOpen ? "Fechar" : "Acompanhar"}
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4">
                      <TrackingSection quote={{ id: j.id, status: j.status, title: j.title }} viewerRole="professional" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}
