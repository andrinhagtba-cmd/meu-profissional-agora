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

  return null;
}
