import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const Route = createFileRoute("/_authenticated/admin/beneficios")({
  head: () => ({ meta: [{ title: "Beneficios — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <AdminPageHeader title="Beneficios" description="Módulo administrativo em preparação." />
      <AdminComingSoon title="Beneficios" />
    </>
  );
}
