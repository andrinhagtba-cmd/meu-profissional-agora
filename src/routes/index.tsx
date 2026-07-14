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
