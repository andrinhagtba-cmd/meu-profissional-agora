import { supabase } from "@/integrations/supabase/client";

export type ConversationRow = {
  id: string;
  quote_request_id: string;
  client_id: string;
  professional_id: string;
  professional_user_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  client_unread_count: number;
  pro_unread_count: number;
  created_at: string;
};

export type ConversationSummary = ConversationRow & {
  quote?: { id: string; title: string; status: string } | null;
  professional?: { id: string; slug: string | null; professional_name: string | null; business_name: string | null } | null;
  client?: { user_id: string; full_name: string | null } | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  read_at: string | null;
  created_at: string;
};

export async function listMyConversations(userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, quote_request_id, client_id, professional_id, professional_user_id,
       last_message_at, last_message_preview, client_unread_count, pro_unread_count, created_at,
       quote:quote_request_id(id, title, status),
       professional:professional_id(id, slug, professional_name, business_name),
       client:client_id(user_id, full_name)`
    )
    .or(`client_id.eq.${userId},professional_user_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ConversationSummary[];
}

export async function getConversation(id: string): Promise<ConversationSummary | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, quote_request_id, client_id, professional_id, professional_user_id,
       last_message_at, last_message_preview, client_unread_count, pro_unread_count, created_at,
       quote:quote_request_id(id, title, status),
       professional:professional_id(id, slug, professional_name, business_name),
       client:client_id(user_id, full_name)`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ConversationSummary) ?? null;
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as MessageRow[];
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body?: string;
  attachment?: { path: string; name: string; type: string; size: number };
}) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    body: input.body ?? null,
    attachment_path: input.attachment?.path ?? null,
    attachment_name: input.attachment?.name ?? null,
    attachment_type: input.attachment?.type ?? null,
    attachment_size: input.attachment?.size ?? null,
  });
  if (error) throw error;
}

export async function uploadAttachment(conversationId: string, file: File): Promise<{
  path: string; name: string; type: string; size: number;
}> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("chat-attachments").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { path, name: file.name, type: file.type, size: file.size };
}

export async function getAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function getOrCreateConversation(quoteId: string, professionalId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_conversation", {
    _quote_id: quoteId,
    _pro_id: professionalId,
  });
  if (error) throw error;
  return data as string;
}

export async function markConversationRead(conversationId: string) {
  const { error } = await supabase.rpc("mark_conversation_read", {
    _conversation_id: conversationId,
  });
  if (error) throw error;
}
