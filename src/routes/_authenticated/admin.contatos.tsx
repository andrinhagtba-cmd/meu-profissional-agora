import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const Route = createFileRoute("/_authenticated/admin/contatos")({
  head: () => ({ meta: [{ title: "Contatos — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <AdminPageHeader title="Contatos" description="Módulo administrativo em preparação." />
      <AdminComingSoon title="Contatos" />
    </>
  );
}
