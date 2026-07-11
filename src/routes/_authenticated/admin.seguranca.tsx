import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const Route = createFileRoute("/_authenticated/admin/seguranca")({
  head: () => ({ meta: [{ title: "Seguranca — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <AdminPageHeader title="Seguranca" description="Módulo administrativo em preparação." />
      <AdminComingSoon title="Seguranca" />
    </>
  );
}
