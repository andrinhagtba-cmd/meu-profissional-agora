import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cadastro/profissional")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { mode: "signup", role: "profissional" } });
  },
});
