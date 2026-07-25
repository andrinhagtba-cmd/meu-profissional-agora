import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedMediaUrl } from "@/lib/mediaUrl";

function BannerImage({ src, alt }: { src: string; alt: string }) {
  const resolved = useResolvedMediaUrl(src);
  return (
    <img
      src={resolved}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />
  );
}


type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
};

export function HomeBanners({ position = "home" }: { position?: string }) {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("banners")
        .select("id,title,subtitle,image_url,link_url,starts_at,ends_at,is_active,position,display_order")
        .eq("is_active", true)
        .eq("position", position)
        .order("display_order", { ascending: true });
      const filtered = (data ?? []).filter(
        (b) =>
          (!b.starts_at || b.starts_at <= nowIso) &&
          (!b.ends_at || b.ends_at >= nowIso),
      );
      setBanners(filtered as Banner[]);
    })();
  }, [position]);

  if (!banners.length) return null;

  const isSingle = banners.length === 1;

  return (
    <section className="container-page py-8">
      <div className={isSingle ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
        {banners.map((b) => {
          const to = b.link_url || "#";
          const isExternal = /^https?:\/\//.test(to);
          const content = (
            <div className={`group relative w-full overflow-hidden rounded-2xl shadow-md ${isSingle ? "aspect-[32/9]" : "aspect-[21/9]"}`}>
              <BannerImage src={b.image_url} alt={b.title ?? "Banner"} />

              {(b.title || b.subtitle) && (
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 text-white">
                  {b.title && <h3 className="text-xl font-bold md:text-2xl">{b.title}</h3>}
                  {b.subtitle && <p className="mt-1 line-clamp-2 max-w-2xl text-sm opacity-90">{b.subtitle}</p>}
                </div>
              )}
            </div>
          );
          if (!b.link_url) return <div key={b.id}>{content}</div>;
          return isExternal ? (
            <a key={b.id} href={to} target="_blank" rel="noopener noreferrer" className="block">{content}</a>
          ) : (
            <Link key={b.id} to={to.startsWith("/") ? to : `/${to}`} className="block">{content}</Link>
          );
        })}
      </div>
    </section>
  );
}

