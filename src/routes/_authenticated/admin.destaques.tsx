import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const Route = createFileRoute("/_authenticated/admin/destaques")({
  head: () => ({ meta: [{ title: "Destaques — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <AdminPageHeader title="Destaques" description="Módulo administrativo em preparação." />
      <AdminComingSoon title="Destaques" />
    </>
  );
}
