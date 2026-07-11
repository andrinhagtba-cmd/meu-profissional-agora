import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, LayoutTemplate, Quote, Sparkles, Wrench } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  head: () => ({ meta: [{ title: "Homepage — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

async function fetchCounts() {
  const [banners, testimonials, blog, cats, faqs] = await Promise.all([
    supabase.from("banners").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("admin_faqs").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);
  return {
    banners: banners.count ?? 0,
    testimonials: testimonials.count ?? 0,
    blog: blog.count ?? 0,
    cats: cats.count ?? 0,
    faqs: faqs.count ?? 0,
  };
}

function Page() {
  const { data } = useQuery({ queryKey: ["homepage-counts"], queryFn: fetchCounts });

  const blocks = [
    { title: "Banners ativos", count: data?.banners ?? 0, to: "/admin/banners", icon: LayoutTemplate, hint: "Vitrines, promoções e destaques rotativos." },
    { title: "Categorias visíveis", count: data?.cats ?? 0, to: "/admin/categorias", icon: Wrench, hint: "Cards de categorias exibidos na home." },
    { title: "Depoimentos publicados", count: data?.testimonials ?? 0, to: "/admin/depoimentos", icon: Quote, hint: "Bloco social proof abaixo dos benefícios." },
    { title: "Posts do blog", count: data?.blog ?? 0, to: "/admin/blog", icon: BookOpen, hint: "Últimos artigos exibidos no rodapé da home." },
    { title: "FAQs publicadas", count: data?.faqs ?? 0, to: "/admin/faqs", icon: Sparkles, hint: "Perguntas frequentes do site." },
  ];

  return (
    <>
      <AdminPageHeader title="Homepage" description="Painel de controle dos blocos da página inicial. Edite cada seção nas telas abaixo." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => (
          <Link key={b.to} to={b.to} className="admin-card group p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <b.icon size={20} />
              </div>
              <span className="font-display text-2xl font-extrabold text-foreground">{b.count}</span>
            </div>
            <div className="mt-4 font-semibold text-foreground group-hover:text-primary">{b.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{b.hint}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
