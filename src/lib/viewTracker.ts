// Rastreador cliente de visitas ao perfil profissional.
// - Gera anonymous_visitor_id persistente em localStorage.
// - Detecta bots comuns pelo user agent (não registra).
// - Não registra se ?admin_preview=1.
// - Deduplicação real é feita no backend (índice único por dia).

import { supabasePublic } from "@/integrations/supabase/publicClient";

const STORAGE_KEY = "gdfm.anon_visitor_id";
const SESSION_KEY = "gdfm.session_id";
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|linkedinbot|twitterbot|embedly|preview|monitor|pingdom|lighthouse|headless/i;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = makeId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = makeId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function isLikelyBot(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent || "";
  if (!ua) return true;
  if (BOT_UA.test(ua)) return true;
  // @ts-expect-error non-standard
  if (navigator.webdriver) return true;
  return false;
}

function isAdminPreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("admin_preview") === "1";
  } catch {
    return false;
  }
}

export type ViewRegistrationResult = {
  public_total: number;
  real_count: number;
  initial_count: number;
} | null;

export async function registerProfileView(slug: string): Promise<ViewRegistrationResult> {
  if (!slug) return null;
  if (typeof window === "undefined") return null;
  if (isLikelyBot()) return null;
  if (isAdminPreview()) return null;

  const anonId = getAnonymousVisitorId();
  const sessionId = getSessionId();
  const referrer = (document.referrer || "").slice(0, 300);
  const uaCat = /mobile|iphone|android/i.test(navigator.userAgent) ? "mobile" : "desktop";

  const { data, error } = await supabasePublic.rpc("register_professional_profile_view", {
    p_slug: slug,
    p_anonymous_visitor_id: anonId,
    p_source: "web",
    p_referrer: referrer || null,
    p_ua_category: uaCat,
    p_session_id: sessionId || null,
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    public_total: Number(row.public_total ?? 0),
    real_count: Number(row.real_count ?? 0),
    initial_count: Number(row.initial_count ?? 0),
  };
}
