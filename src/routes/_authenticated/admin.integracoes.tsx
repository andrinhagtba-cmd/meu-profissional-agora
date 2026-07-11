import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const Route = createFileRoute("/_authenticated/admin/integracoes")({
  head: () => ({ meta: [{ title: "Integracoes — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <AdminPageHeader title="Integracoes" description="Módulo administrativo em preparação." />
      <AdminComingSoon title="Integracoes" />
    </>
  );
}
