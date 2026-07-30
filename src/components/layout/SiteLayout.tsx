import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { MobileTabBar } from "@/components/mobile/MobileTabBar";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden">
      <TopBar />
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      <div className="h-16 md:hidden" aria-hidden="true" />
      <MobileTabBar />
      <FloatingWhatsApp />
    </div>
  );
}

