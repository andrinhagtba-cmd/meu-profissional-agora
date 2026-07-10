import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteLayout } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — ProConecta" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Enviamos um link de recuperação para seu e-mail.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <SiteLayout>
      <div className="container-page py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl font-extrabold text-foreground">Recuperar senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link para redefinir a senha.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={sending} className="h-11 w-full rounded-xl">
              {sending ? "Enviando..." : "Enviar link"}
            </Button>
            <div className="text-center text-sm">
              <Link to="/auth" search={{ mode: "login" }} className="text-primary hover:underline">Voltar ao login</Link>
            </div>
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
