import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedMediaUrl } from "@/lib/mediaUrl";

function BannerImage({ src, alt, active }: { src: string; alt: string; active: boolean }) {
  const resolved = useResolvedMediaUrl(src);
  return (
    <img
      src={resolved}
      alt={alt}
      className="h-full w-full object-cover will-change-transform"
      style={{
        transform: active ? "scale(1.06)" : "scale(1)",
        transition: "transform 6000ms cubic-bezier(0.22,1,0.36,1)",
      }}
      loading="eager"
      decoding="async"
    />
  );
}

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  rotation_seconds?: number | null;
};

export function HomeBanners({ position = "home" }: { position?: string }) {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("banners")
        .select("id,title,subtitle,image_url,link_url,starts_at,ends_at,is_active,position,display_order,rotation_seconds")
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

  return <BannerSlider banners={banners} />;
}

function BannerSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  const currentDelay = Math.max(2, Number(banners[index]?.rotation_seconds) || 15) * 1000;

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, currentDelay);
    return () => clearTimeout(t);
  }, [banners.length, index, currentDelay]);

  useEffect(() => {
    setIndex(0);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section className="container-page py-8">
      <div className="relative">
        <div className="relative aspect-[32/9] w-full overflow-hidden rounded-2xl shadow-lg">
          {banners.map((b, i) => {
            const active = i === index;
            const to = b.link_url || "#";
            const isExternal = /^https?:\/\//.test(to);
            const overlay = (
              <>
                <BannerImage src={b.image_url} alt={b.title ?? "Banner"} active={active} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {(b.title || b.subtitle) && (
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-6 text-white"
                    style={{
                      opacity: active ? 1 : 0,
                      transform: active ? "translateY(0)" : "translateY(12px)",
                      transition: "opacity 1200ms ease-out 200ms, transform 1200ms ease-out 200ms",
                    }}
                  >
                    {b.title && <h3 className="text-xl font-bold md:text-2xl">{b.title}</h3>}
                    {b.subtitle && <p className="mt-1 line-clamp-2 max-w-2xl text-sm opacity-90">{b.subtitle}</p>}
                  </div>
                )}
              </>
            );
            return (
              <div
                key={b.id}
                className={`absolute inset-0 ${
                  active ? "pointer-events-auto" : "pointer-events-none"
                }`}
                style={{
                  opacity: active ? 1 : 0,
                  transition: "opacity 1500ms cubic-bezier(0.4,0,0.2,1)",
                }}
                aria-hidden={!active}
              >
                {!b.link_url ? (
                  <div className="group h-full w-full">{overlay}</div>
                ) : isExternal ? (
                  <a href={to} target="_blank" rel="noopener noreferrer" className="group block h-full w-full">{overlay}</a>
                ) : (
                  <Link to={to.startsWith("/") ? to : `/${to}`} className="group block h-full w-full">{overlay}</Link>
                )}
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {banners.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ir para banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
