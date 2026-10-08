import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Hero } from "@/components/home/Hero";
import { HomeBanners } from "@/components/home/HomeBanners";
import { PopularServices } from "@/components/home/PopularServices";
import { FeaturedPros } from "@/components/home/FeaturedPros";
import { NearbyPros } from "@/components/home/NearbyPros";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Benefits } from "@/components/home/Benefits";
import { RecentRequests } from "@/components/home/RecentRequests";
import { Testimonials } from "@/components/home/Testimonials";
import { ProCTA } from "@/components/home/ProCTA";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Guia DF na Mídia — Empresas e profissionais no Distrito Federal" },
    { name: "description", content: "Encontre empresas, serviços e profissionais no Distrito Federal e entre em contato pelo Guia DF na Mídia." },
    { property: "og:title", content: "Guia DF na Mídia — Empresas e profissionais" },
    { property: "og:description", content: "Encontre empresas, serviços e profissionais no Distrito Federal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <HomeBanners position="home" />
      <PopularServices />

      <FeaturedPros />
      <NearbyPros />
      <Benefits />
      <HowItWorks />
      <RecentRequests />
      <Testimonials />
      <ProCTA />
    </SiteLayout>
  );
}
