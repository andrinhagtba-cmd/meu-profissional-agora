import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden">
      <TopBar />
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

