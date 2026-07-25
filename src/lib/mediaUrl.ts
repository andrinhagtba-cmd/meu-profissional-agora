import { useEffect, useState } from "react";
import { getMediaUrl } from "@/services/mediaService";

/**
 * Storage URLs saved in the database (banners, categorias, etc.) are signed and
 * expire after some days. This parses the bucket/path back out so we can
 * re-sign a fresh URL at render time.
 */
export function parseStorageUrl(
  url: string | null | undefined,
): { bucket: string; path: string } | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/([^?]+)/);
  if (!m) return null;
  try {
    return { bucket: m[1], path: decodeURIComponent(m[2]) };
  } catch {
    return { bucket: m[1], path: m[2] };
  }
}

export async function resolveStoredMediaUrl(url: string | null | undefined): Promise<string> {
  if (!url) return "";
  const ref = parseStorageUrl(url);
  if (!ref) return url;
  const fresh = await getMediaUrl(ref);
  return fresh || url;
}

/** Returns a freshly-signed URL for a stored storage URL (falls back to the original). */
export function useResolvedMediaUrl(url: string | null | undefined): string {
  const [resolved, setResolved] = useState<string>(url ?? "");

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setResolved("");
      return;
    }
    setResolved(url);
    resolveStoredMediaUrl(url).then((u) => {
      if (!cancelled) setResolved(u);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return resolved;
}
