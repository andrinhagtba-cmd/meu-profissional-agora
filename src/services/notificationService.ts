import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

export type NotificationRecord = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
  read_at: string | null;
  priority: string;
  entity_type: string | null;
  entity_id: string | null;
  push_status: string;
};

export type NotificationGroup =
  | "all"
  | "messages"
  | "quotes"
  | "proposals"
  | "reviews"
  | "system";

export const NOTIFICATION_GROUPS: { value: NotificationGroup; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "messages", label: "Mensagens" },
  { value: "quotes", label: "Pedidos" },
  { value: "proposals", label: "Propostas" },
  { value: "reviews", label: "Avaliações" },
  { value: "system", label: "Sistema" },
];

const GROUP_TYPES: Record<Exclude<NotificationGroup, "all">, NotificationType[]> = {
  messages: ["message", "message_new"],
  quotes: ["quote_status", "opportunity"],
  proposals: ["proposal", "proposal_accepted", "proposal_rejected"],
  reviews: ["review", "review_new"],
  system: ["system", "info", "moderation"],
};

export function groupOfType(type: string): Exclude<NotificationGroup, "all"> {
  for (const [group, types] of Object.entries(GROUP_TYPES)) {
    if (types.includes(type)) return group as Exclude<NotificationGroup, "all">;
  }
  return "system";
}

const SELECT =
  "id, title, message, type, link, read, created_at, read_at, priority, entity_type, entity_id, push_status";

export async function listUserNotifications(
  userId: string,
  options: { group?: NotificationGroup; onlyUnread?: boolean; limit?: number } = {},
): Promise<NotificationRecord[]> {
  const { group = "all", onlyUnread = false, limit = 100 } = options;

  let query = supabase
    .from("notifications")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (group !== "all") query = query.in("type", GROUP_TYPES[group]);
  if (onlyUnread) query = query.eq("read", false);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NotificationRecord[];
}

export type NotificationCounters = {
  total: number;
  unread: number;
  byGroup: Record<Exclude<NotificationGroup, "all">, number>;
};

export async function getNotificationCounters(userId: string): Promise<NotificationCounters> {
  const { data, error } = await supabase
    .from("notifications")
    .select("type, read")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (data ?? []) as { type: string; read: boolean }[];
  const byGroup = { messages: 0, quotes: 0, proposals: 0, reviews: 0, system: 0 };
  let unread = 0;
  for (const row of rows) {
    if (!row.read) {
      unread += 1;
      byGroup[groupOfType(row.type)] += 1;
    }
  }
  return { total: rows.length, unread, byGroup };
}

export async function markNotificationsRead(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .in("id", ids);
  if (error) throw error;
}

export async function markGroupRead(userId: string, group: NotificationGroup) {
  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (group !== "all") query = query.in("type", GROUP_TYPES[group]);
  const { error } = await query;
  if (error) throw error;
}

export async function markNotificationUnread(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: false, read_at: null })
    .eq("id", id);
  if (error) throw error;
}
