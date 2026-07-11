import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const Route = createFileRoute("/_authenticated/admin/permissoes")({
  head: () => ({ meta: [{ title: "Permissoes — Admin ProConecta" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <AdminPageHeader title="Permissoes" description="Módulo administrativo em preparação." />
      <AdminComingSoon title="Permissoes" />
    </>
  );
}
