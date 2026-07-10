import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({ meta: [{ title: "Meus favoritos — ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Favoritos,
});

function Favoritos() {
  return (
    <SiteLayout>
      <div className="container-page py-12">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Meus favoritos</h1>
        <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center">
          <Heart className="mx-auto text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Você ainda não favoritou nenhum profissional.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
