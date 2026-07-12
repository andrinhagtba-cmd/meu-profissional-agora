import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    let active = true;
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      let session = data.session;
      const expiresAt = session?.expires_at ?? 0;
      if (session && expiresAt * 1000 <= Date.now() + 60_000) {
        const refreshed = await supabase.auth.refreshSession();
        session = refreshed.data.session ?? null;
        if (!session) await supabase.auth.signOut();
      }
      if (active) setState({ session, user: session?.user ?? null, loading: false });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });
    syncSession();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
