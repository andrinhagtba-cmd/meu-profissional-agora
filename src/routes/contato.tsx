import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato" },
      { name: "description", content: "Fale com a equipe ${BRAND_PLACEHOLDER} para suporte, imprensa, parcerias e dúvidas sobre serviços profissionais." },
      { property: "og:title", content: "Contato" },
      { property: "og:description", content: "Envie sua mensagem para a equipe ${BRAND_PLACEHOLDER}." },
    ],
  }),
  component: ContatoPage,
});

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

async function submitContact(form: ContactForm) {
  const { error } = await supabase.from("contact_messages").insert({
    name: form.name,
    email: form.email,
    phone: form.phone || null,
    subject: form.subject || "Contato pelo site",
    message: form.message,
    channel: "site",
    priority: "normal",
    status: "new",
    metadata: {},
  });
  if (error) throw error;
}

function ContatoPage() {
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", phone: "", subject: "", message: "" });
  const mutation = useMutation({
    mutationFn: () => submitContact(form),
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso!");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SiteLayout>
      <section className="container-page grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-[#0a4bd8] p-8 text-primary-foreground shadow-card lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <MessageCircle size={13} /> Atendimento ${BRAND_PLACEHOLDER}
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight lg:text-5xl">Contato</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/85 lg:text-base">
            Fale com a equipe para suporte, parcerias, imprensa ou dúvidas sobre sua conta.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <p className="inline-flex items-center gap-2"><Mail size={16} /> contato@proconecta.com.br</p>
            <p className="inline-flex items-center gap-2"><MapPin size={16} /> Atendimento nacional · Brasil</p>
          </div>
          <Button asChild variant="outline" className="mt-8 h-11 rounded-xl border-white/30 bg-white/10 px-5 font-semibold text-white hover:bg-white/20 hover:text-white">
            <Link to="/painel/notificacoes">Acessar suporte pelo painel</Link>
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
          className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact-name" className="font-semibold">Nome</Label>
              <Input id="contact-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-12 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="contact-email" className="font-semibold">E-mail</Label>
              <Input id="contact-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 h-12 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="contact-phone" className="font-semibold">Telefone</Label>
              <Input id="contact-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 h-12 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="contact-subject" className="font-semibold">Assunto</Label>
              <Input id="contact-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-2 h-12 rounded-xl" />
            </div>
          </div>
          <div className="mt-5">
            <Label htmlFor="contact-message" className="font-semibold">Mensagem</Label>
            <Textarea id="contact-message" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-2 min-h-36 rounded-xl" />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="mt-6 h-12 rounded-xl px-6 font-semibold">
            <Send size={16} /> {mutation.isPending ? "Enviando…" : "Enviar mensagem"}
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}