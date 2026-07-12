import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Newspaper, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog" },
      { name: "description", content: "Guias, tendências e dicas para contratar serviços profissionais com segurança." },
      { property: "og:title", content: "Blog" },
      { property: "og:description", content: "Conteúdos da plataforma para clientes e profissionais de serviços." },
    ],
  }),
  component: BlogPage,
});

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  published_at: string | null;
};

async function listPublicPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, category, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return (data ?? []) as Post[];
}

const fallbackPosts: Post[] = [
  { id: "1", title: "Como comparar propostas de serviços sem cair em armadilhas", slug: "comparar-propostas", excerpt: "Critérios simples para avaliar preço, prazo, escopo e reputação antes de contratar.", category: "Contratação", published_at: new Date().toISOString() },
  { id: "2", title: "O que um perfil profissional precisa para gerar confiança", slug: "perfil-profissional", excerpt: "Fotos, portfólio, descrição objetiva e avaliações reais fazem diferença na decisão do cliente.", category: "Profissionais", published_at: new Date().toISOString() },
  { id: "3", title: "Checklist antes de iniciar uma reforma residencial", slug: "checklist-reforma", excerpt: "Organize orçamento, materiais, prazos e comunicação para evitar retrabalho.", category: "Serviços", published_at: new Date().toISOString() },
];

function BlogPage() {
  const { data, isLoading } = useQuery({ queryKey: ["public-blog-posts"], queryFn: listPublicPosts });
  const posts = data?.length ? data : fallbackPosts;

  return (
    <SiteLayout>
      <section className="container-page py-12 lg:py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-primary">
            <Sparkles size={13} /> Conteúdo editorial
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">Blog</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Guias práticos para clientes contratarem melhor e profissionais venderem com mais confiança.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="flex min-h-64 flex-col rounded-3xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-float">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
                  <Newspaper size={22} />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-orange">{post.category || "Guia"}</p>
                <h2 className="mt-2 line-clamp-2 font-display text-xl font-extrabold text-foreground">{post.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR") : "Em breve"}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary">Ler <ArrowRight size={13} /></span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-border bg-secondary/50 p-6 text-center">
          <p className="font-display text-xl font-extrabold text-foreground">Precisa de um profissional agora?</p>
          <Button asChild className="mt-4 h-11 rounded-xl bg-orange px-5 font-semibold text-orange-foreground hover:bg-orange/90">
            <Link to="/pedir-orcamento" search={{} as never}>Pedir orçamento</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}