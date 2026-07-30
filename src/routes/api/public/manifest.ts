import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Manifest dinâmico: nome, descrição, cores e ícone vêm das configurações
 * do admin (system_settings -> public_branding). Fallback para os ícones
 * estáticos quando nenhum ícone personalizado estiver definido.
 */
export const Route = createFileRoute("/api/public/manifest")({
  server: {
    handlers: {
      GET: async () => {
        const fallback = {
          id: "/",
          name: "Guia DF na Mídia — Profissionais e Serviços do DF",
          short_name: "Guia DF",
          description:
            "Encontre profissionais e empresas do Distrito Federal, peça orçamentos e acompanhe tudo pelo aplicativo.",
          theme_color: "#0759F8",
          background_color: "#F7F9FD",
        };

        let branding: Record<string, unknown> = {};
        let iconUrl: string | null = null;

        try {
          const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const key =
            process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const supabase = createClient(url, key, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: { headers: { apikey: key } },
            });
            const { data } = await supabase
              .from("public_branding")
              .select("*")
              .maybeSingle();
            branding = (data ?? {}) as Record<string, unknown>;

            const iconId = branding.pwa_icon_media_id ?? branding.favicon_media_id;
            if (iconId) {
              const { data: asset } = await supabase
                .from("media_assets")
                .select("bucket_name, object_path")
                .eq("id", iconId as string)
                .maybeSingle();
              if (asset) {
                const { data: signed } = await supabase.storage
                  .from(asset.bucket_name as string)
                  .createSignedUrl(asset.object_path as string, 60 * 60 * 24 * 7);
                iconUrl = signed?.signedUrl ?? null;
              }
            }
          }
        } catch {
          /* usa fallback */
        }

        const brandName = (branding.brand_name as string) || fallback.name;
        const staticIcons: Array<Record<string, string>> = [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ];

        let icons = staticIcons;
        if (iconUrl) {
          // Ícone do admin servido pela MESMA origem. Quando existe, ele é o
          // único do manifest — senão o navegador prefere os ícones estáticos
          // por casarem exatamente com os tamanhos declarados.
          const version = String((branding.pwa_icon_media_id as string) ?? "brand").slice(0, 8);
          const localIcon = `/api/public/pwa-icon?v=${version}`;
          icons = [
            { src: localIcon, sizes: "any", type: "image/png", purpose: "any" },
            { src: localIcon, sizes: "512x512", type: "image/png", purpose: "any" },
            { src: localIcon, sizes: "192x192", type: "image/png", purpose: "any" },
            { src: localIcon, sizes: "any", type: "image/png", purpose: "maskable" },
          ];
        }

        const manifest = {
          id: "/",
          name: (branding.pwa_name as string) || brandName,
          short_name: (branding.pwa_short_name as string) || brandName.slice(0, 12),
          description:
            (branding.pwa_description as string) ||
            (branding.tagline as string) ||
            fallback.description,
          start_url: "/?source=pwa",
          scope: "/",
          display: "standalone",
          display_override: ["standalone", "minimal-ui", "browser"],
          orientation: "portrait-primary",
          theme_color:
            (branding.pwa_theme_color as string) ||
            (branding.primary_color as string) ||
            fallback.theme_color,
          background_color:
            (branding.pwa_background_color as string) || fallback.background_color,
          lang: "pt-BR",
          dir: "ltr",
          categories: ["business", "productivity", "shopping"],
          prefer_related_applications: false,
          icons,
          shortcuts: [
            { name: "Notificações", short_name: "Notificações", url: "/painel/notificacoes" },
            { name: "Mensagens", short_name: "Mensagens", url: "/painel/mensagens" },
            { name: "Pedidos recentes", short_name: "Pedidos", url: "/painel/pedidos" },
            { name: "Profissionais", short_name: "Profissionais", url: "/profissionais" },
            { name: "Assinatura", short_name: "Assinatura", url: "/planos" },
          ],
        };

        return new Response(JSON.stringify(manifest), {
          headers: {
            "content-type": "application/manifest+json; charset=utf-8",
            "cache-control": "public, max-age=300, must-revalidate",
          },
        });
      },
    },
  },
});
