import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { listMediaAssets, type AdminMediaAsset } from "@/services/adminContentService";
import { getSignedMediaUrl } from "@/services/mediaService";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/midias")({
  head: () => ({ meta: [{ title: "Mídias — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const FILTERS = [
  { value: "", label: "Todas" },
  { value: "avatar", label: "Avatares" },
  { value: "cover", label: "Capas" },
  { value: "portfolio", label: "Portfólio" },
  { value: "category", label: "Categorias" },
];

function Page() {
  const [search, setSearch] = useState("");
  const [usage, setUsage] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-media", search, usage],
    queryFn: () => listMediaAssets(search, usage || undefined),
  });

  return (
    <>
      <AdminPageHeader title="Mídias" description="Todos os arquivos hospedados nos buckets da plataforma." />
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Buscar por caminho, título ou alt…"
        filters={FILTERS} activeFilter={usage} onFilterChange={setUsage} />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="admin-card p-12 text-center text-sm text-muted-foreground">Nenhuma mídia encontrada.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.map((m) => <MediaCard key={m.id} asset={m} />)}
        </div>
      )}
    </>
  );
}

function MediaCard({ asset }: { asset: AdminMediaAsset }) {
  const { data: url } = useQuery({
    queryKey: ["signed-media", asset.bucket_name, asset.object_path],
    queryFn: () => getSignedMediaUrl(asset.bucket_name, asset.object_path),
    staleTime: 5 * 60 * 1000,
  });
  const kb = asset.file_size_bytes ? Math.round(asset.file_size_bytes / 1024) : null;

  return (
    <div className="admin-card overflow-hidden">
      <div className="aspect-square overflow-hidden bg-secondary">
        {url ? (
          <img src={url} alt={asset.alt_text ?? ""} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center text-primary/30"><ImageIcon size={28} /></div>
        )}
      </div>
      <div className="p-2">
        <div className="line-clamp-1 text-xs font-medium text-foreground">{asset.title ?? asset.object_path.split("/").pop()}</div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{asset.usage_type ?? "—"}</span>
          {kb !== null && <span>{kb} KB</span>}
        </div>
      </div>
    </div>
  );
}
