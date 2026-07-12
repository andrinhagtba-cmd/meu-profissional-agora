import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteLayout } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada!");
      navigate({ to: "/painel" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SiteLayout>
      <div className="container-page py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl font-extrabold text-foreground">Nova senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">Escolha uma nova senha para sua conta.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl">
              {saving ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
