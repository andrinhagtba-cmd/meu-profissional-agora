import { useQuery } from "@tanstack/react-query";
import { getSettings, type SystemSettings } from "@/services/settingsService";

/**
 * Reads the singleton system_settings. Cached for 5min; safe to call from
 * many components — React Query dedupes.
 */
export function useBrand(): {
  data: SystemSettings | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: getSettings,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { data, isLoading };
}
