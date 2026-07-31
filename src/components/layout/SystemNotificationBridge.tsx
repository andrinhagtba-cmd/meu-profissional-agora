import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type NotificationRow = {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  user_id: string;
};

export function SystemNotificationBridge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`system-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as NotificationRow;
          queryClient.invalidateQueries({ queryKey: ["painel"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });

          toast(notification.title, {
            description: notification.message ?? undefined,
            icon: <Bell size={16} />,
            action: notification.link
              ? {
                  label: "Abrir",
                  onClick: () => window.location.assign(notification.link!),
                }
              : undefined,
          });

          // A notificação do sistema é exibida exclusivamente pelo Service Worker.
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  return null;
}