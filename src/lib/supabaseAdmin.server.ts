// Cliente admin (service role) tolerante a variações de nome das variáveis
// de ambiente — necessário para deploys self-hosted (VPS/Coolify), onde os
// nomes podem divergir do padrão gerado pelo Lovable Cloud.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const URL_KEYS = ["SUPABASE_URL", "VITE_SUPABASE_URL", "NUXT_SUPABASE_URL", "PUBLIC_SUPABASE_URL"] as const;

const SERVICE_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
] as const;

function pick(keys: readonly string[]): { name: string; value: string } | null {
  for (const name of keys) {
    const value = process.env[name];
    if (value && value.trim()) return { name, value: value.trim() };
  }
  return null;
}

function isOpaqueKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function buildFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isOpaqueKey(key) && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function create() {
  const url = pick(URL_KEYS);
  const key = pick(SERVICE_KEYS);

  if (!url || !key) {
    const missing = [
      ...(!url ? [`URL do Supabase (${URL_KEYS.join(" | ")})`] : []),
      ...(!key ? [`chave service_role (${SERVICE_KEYS.join(" | ")})`] : []),
    ];
    const seen = Object.keys(process.env)
      .filter((n) => n.toUpperCase().includes("SUPABASE"))
      .sort()
      .join(", ") || "nenhuma";
    throw new Error(
      `Configuração do servidor incompleta: falta ${missing.join(" e ")}. ` +
        `Variáveis SUPABASE_* encontradas neste servidor: ${seen}. ` +
        `Defina-as no ambiente do deploy (build + runtime) e refaça o deploy.`,
    );
  }

  return createClient<Database>(url.value, key.value, {
    global: { fetch: buildFetch(key.value) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let cached: ReturnType<typeof create> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof create>, {
  get(_, prop, receiver) {
    if (!cached) cached = create();
    return Reflect.get(cached, prop, receiver);
  },
});
