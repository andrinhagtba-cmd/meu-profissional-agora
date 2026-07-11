import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  addFavoriteBySlug,
  listFavoriteProfessionalSlugs,
  removeFavoriteBySlug,
} from "@/services/clientService";

// Favoritos híbridos:
// - Anônimo: persistidos em localStorage.
// - Autenticado: sincronizados com a tabela `favorites` no Supabase.
// A UI continua usando `slug` como chave para não quebrar os componentes.

const KEY = "proconecta:favorites";
const EVENT = "proconecta:favorites-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function write(next: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Sessão + escuta de mudanças
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Boot: lê localStorage + escuta eventos locais
  useEffect(() => {
    setFavorites(read());
    const sync = () => setFavorites(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Ao logar: puxa do DB, mescla com locais e sobe pendentes para o DB.
  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    (async () => {
      try {
        const remote = await listFavoriteProfessionalSlugs(userId);
        const local = read();
        const merged = Array.from(new Set([...remote, ...local]));
        // Sobe locais que ainda não estão no remoto
        const missing = local.filter((s) => !remote.includes(s));
        await Promise.all(missing.map((s) => addFavoriteBySlug(userId, s)));
        if (cancel) return;
        write(merged);
      } catch (err) {
        console.error("[favorites] sync inicial falhou", err);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    (slug: string) => {
      const current = read();
      const willAdd = !current.includes(slug);
      const next = willAdd ? [...current, slug] : current.filter((s) => s !== slug);
      write(next);
      if (userId) {
        (willAdd
          ? addFavoriteBySlug(userId, slug)
          : removeFavoriteBySlug(userId, slug)
        ).catch((err) => console.error("[favorites] sync falhou", err));
      }
      return willAdd;
    },
    [userId],
  );

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
