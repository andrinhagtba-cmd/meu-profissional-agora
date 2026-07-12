import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getConversation,
  listMessages,
  sendMessage,
  uploadAttachment,
  getAttachmentUrl,
  markConversationRead,
  type MessageRow,
} from "@/services/chatService";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Paperclip, Send, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/painel/mensagens/$id")({
  head: () => ({
    meta: [
      { title: "Conversa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConversationView,
});

function ConversationView() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const conv = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id),
  });

  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => listMessages(id),
  });

  // Mark as read whenever data loads
  useEffect(() => {
    if (!user?.id || !messages.data) return;
    markConversationRead(id).catch(() => {});
  }, [id, user?.id, messages.data]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`conv:${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          qc.setQueryData<MessageRow[]>(["messages", id], (prev) => {
            const list = prev ?? [];
            const next = payload.new as MessageRow;
            if (list.some((m) => m.id === next.id)) return list;
            return [...list, next];
          });
          markConversationRead(id).catch(() => {});
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Não autenticado");
      const trimmed = text.trim();
      if (!trimmed && !file) return;
      let attachment: { path: string; name: string; type: string; size: number } | undefined;
      if (file) {
        attachment = await uploadAttachment(id, file);
      }
      await sendMessage({
        conversationId: id,
        senderId: user.id,
        body: trimmed || undefined,
        attachment,
      });
    },
    onSuccess: () => {
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao enviar"),
  });

  const c = conv.data;
  const isClient = c?.client_id === user?.id;
  const otherName = isClient
    ? (c?.professional?.professional_name || c?.professional?.business_name || "Profissional")
    : (c?.client?.full_name || "Cliente");

  return (
    <SiteLayout>
      <div className="container-page py-6 lg:py-10">
        <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-4">
            <Link to="/painel/mensagens" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold">{otherName}</p>
              {c?.quote?.title && (
                <p className="truncate text-xs text-muted-foreground">Pedido: {c.quote.title}</p>
              )}
            </div>
            {c?.quote?.id && (
              <Link
                to="/painel/pedidos/$id"
                params={{ id: c.quote.id }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Ver pedido
              </Link>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2 overflow-y-auto bg-secondary/30 px-4 py-4">
            {messages.isLoading && <p className="text-center text-sm text-muted-foreground">Carregando…</p>}
            {messages.data?.length === 0 && (
              <p className="mt-10 text-center text-sm text-muted-foreground">
                Envie a primeira mensagem para começar a conversa.
              </p>
            )}
            {messages.data?.map((m) => (
              <MessageBubble key={m.id} m={m} mine={m.sender_id === user?.id} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-card px-4 py-3">
            {file && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
                <span className="truncate"><Paperclip size={14} className="mr-2 inline" />{file.name}</span>
                <button
                  onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >Remover</button>
              </div>
            )}
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => { e.preventDefault(); send.mutate(); }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground"
                aria-label="Anexar arquivo"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 20 * 1024 * 1024) { toast.error("Arquivo maior que 20MB"); return; }
                  setFile(f);
                }}
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva uma mensagem…"
                rows={1}
                className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send.mutate();
                  }
                }}
              />
              <Button
                type="submit"
                disabled={send.isPending || (!text.trim() && !file)}
                className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {send.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function MessageBubble({ m, mine }: { m: MessageRow; mine: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
        mine ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
      }`}>
        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
        {m.attachment_path && <AttachmentLink path={m.attachment_path} name={m.attachment_name} mine={mine} />}
        <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function AttachmentLink({ path, name, mine }: { path: string; name: string | null; mine: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleClick = async (e: React.MouseEvent) => {
    if (url) return;
    e.preventDefault();
    setLoading(true);
    try {
      const u = await getAttachmentUrl(path);
      setUrl(u);
      window.open(u, "_blank");
    } catch {
      toast.error("Erro ao abrir anexo");
    } finally {
      setLoading(false);
    }
  };
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold underline ${
        mine ? "text-primary-foreground/90" : "text-primary"
      }`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      {name || "Anexo"}
    </a>
  );
}
