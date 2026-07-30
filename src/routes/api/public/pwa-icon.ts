import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Serve o ícone do PWA na MESMA origem do site.
 * Navegadores (Chrome/Android) frequentemente ignoram ícones de manifest
 * hospedados em outro domínio com URL assinada — por isso fazemos proxy aqui.
 */
export const Route = createFileRoute("/api/public/pwa-icon")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const key =
            process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          if (!url || !key) throw new Error("missing supabase env");

          const supabase = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { apikey: key } },
          });

          const { data: branding } = await supabase
            .from("public_branding")
            .select("pwa_icon_media_id, favicon_media_id, logo_light_media_id")
            .maybeSingle();

          const iconId =
            branding?.pwa_icon_media_id ??
            branding?.favicon_media_id ??
            branding?.logo_light_media_id;
          if (!iconId) throw new Error("no icon");

          const { data: asset } = await supabase
            .from("media_assets")
            .select("bucket_name, object_path, mime_type")
            .eq("id", iconId as string)
            .maybeSingle();
          if (!asset) throw new Error("no asset");

          const { data: signed } = await supabase.storage
            .from(asset.bucket_name as string)
            .createSignedUrl(asset.object_path as string, 60 * 10);
          if (!signed?.signedUrl) throw new Error("no signed url");

          const upstream = await fetch(signed.signedUrl);
          if (!upstream.ok) throw new Error("upstream error");

          return new Response(upstream.body, {
            headers: {
              "content-type":
                upstream.headers.get("content-type") ||
                (asset.mime_type as string) ||
                "image/png",
              "cache-control": "public, max-age=300, must-revalidate",
            },
          });
        } catch {
          // Fallback: ícone estático do projeto
          return new Response(null, { status: 302, headers: { location: "/icons/icon-512.png" } });
        }
      },
    },
  },
});
