import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  getNotificationCounters,
  listUserNotifications,
  markGroupRead,
  markNotificationUnread,
  markNotificationsRead,
  type NotificationGroup,
} from "@/services/notificationService";

export function useNotificationCenter(options: {
  group?: NotificationGroup;
  onlyUnread?: boolean;
  enabled?: boolean;
} = {}) {
  const { group = "all", onlyUnread = false, enabled = true } = options;
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notification-center-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notification-center"] });
          qc.invalidateQueries({ queryKey: ["notification-counters"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, userId]);

  const listQuery = useQuery({
    queryKey: ["notification-center", userId, group, onlyUnread],
    enabled: !!userId && enabled,
    queryFn: () => listUserNotifications(userId!, { group, onlyUnread }),
  });

  const countersQuery = useQuery({
    queryKey: ["notification-counters", userId],
    enabled: !!userId,
    queryFn: () => getNotificationCounters(userId!),
    staleTime: 15_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["notification-center"] });
    qc.invalidateQueries({ queryKey: ["notification-counters"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["painel"] });
  };

  const markRead = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: invalidate,
  });

  const markUnread = useMutation({
    mutationFn: (id: string) => markNotificationUnread(id),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: (target: NotificationGroup) => markGroupRead(userId!, target),
    onSuccess: invalidate,
  });

  const unreadCount = countersQuery.data?.unread ?? 0;

  const items = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  return {
    items,
    isLoading: listQuery.isLoading,
    refetch: async () => {
      await Promise.all([listQuery.refetch(), countersQuery.refetch()]);
    },
    counters: countersQuery.data,
    unreadCount,
    markRead,
    markUnread,
    markAll,
    isAuthenticated: !!userId,
  };
}
