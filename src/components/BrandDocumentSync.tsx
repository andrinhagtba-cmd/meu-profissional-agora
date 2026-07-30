import { useEffect } from "react";
import { useBrand } from "@/hooks/use-brand";

/**
 * Client-only: syncs the browser tab title and favicon with the brand
 * configured in system_settings. Mounted once inside the router shell.
 */
export function BrandDocumentSync() {
  const { data } = useBrand();
  const brandName = data?.brand_name;
  const faviconUrl = data?.favicon_url;
  const logoLight = data?.logo_light_url;
  const appIcon = data?.pwa_icon_url;
  const appName = data?.pwa_short_name || data?.pwa_name || data?.brand_name;
  const themeColor = data?.pwa_theme_color || data?.primary_color;

  useEffect(() => {
    if (typeof document === "undefined" || !brandName) return;
    // Only prefix the current tab title (leave route-specific title intact).
    const current = document.title;
    if (!current.includes(brandName)) {
      document.title = `${brandName} — ${current.split("—").pop()?.trim() ?? current}`;
    }
  }, [brandName]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = faviconUrl || logoLight;
    if (!href) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [faviconUrl, logoLight]);

  // Ícone do app (iOS / Android) + cor do tema, conforme configurado no admin.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = appIcon || faviconUrl || logoLight;
    if (!href) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "apple-touch-icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [appIcon, faviconUrl, logoLight]);

  useEffect(() => {
    if (typeof document === "undefined" || !themeColor) return;
    let meta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = themeColor;
  }, [themeColor]);

  useEffect(() => {
    if (typeof document === "undefined" || !appName) return;
    for (const name of ["apple-mobile-web-app-title", "application-name"]) {
      let meta = document.querySelector<HTMLMetaElement>(`meta[name='${name}']`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = appName;
    }
  }, [appName]);

  return null;
}
