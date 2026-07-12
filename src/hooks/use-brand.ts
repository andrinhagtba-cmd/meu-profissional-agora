import { useQuery } from "@tanstack/react-query";
import { getSettings, type SystemSettings } from "@/services/settingsService";

const CACHE_KEY = "brand:settings:v2";

function readCache(): SystemSettings | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as SystemSettings;
    const hasVisibleBrand = Boolean(
      parsed.logo_light_url ||
        parsed.logo_dark_url ||
        parsed.logo_light_media_id ||
        parsed.logo_dark_media_id ||
        parsed.brand_name?.trim(),
    );
    return hasVisibleBrand ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(data: SystemSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Reads the singleton system_settings. Hydrates instantly from localStorage
 * so the logo/brand appear without a network round-trip on repeat visits,
 * then revalidates in the background.
 */
export function useBrand(): {
  data: SystemSettings | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const fresh = await getSettings();
      writeCache(fresh);
      return fresh;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: readCache,
    initialDataUpdatedAt: 0,
  });
  return { data, isLoading: isLoading && !data };
}
