import { supabasePublic } from "@/integrations/supabase/publicClient";

export type MediaRef = { bucket: string; path: string } | null | undefined;

const SIGN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const cacheKey = (ref: { bucket: string; path: string }) =>
  `${ref.bucket}/${ref.path}`;

export async function getMediaUrl(ref: MediaRef): Promise<string> {
  if (!ref?.path || !ref.bucket) return "";
  const key = cacheKey(ref);
  const cached = cache.get(key);
  if (cached) return cached;
  const running = inflight.get(key);
  if (running) return running;

  const promise = (async () => {
    const { data, error } = await supabasePublic.storage
      .from(ref.bucket)
      .createSignedUrl(ref.path, SIGN_TTL_SECONDS);
    if (error || !data?.signedUrl) return "";
    cache.set(key, data.signedUrl);
    return data.signedUrl;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

export async function getMediaUrls(refs: MediaRef[]): Promise<string[]> {
  const results: string[] = new Array(refs.length).fill("");
  const groups = new Map<string, { index: number; path: string }[]>();

  refs.forEach((ref, index) => {
    if (!ref?.path || !ref.bucket) return;
    const cached = cache.get(cacheKey(ref));
    if (cached) {
      results[index] = cached;
      return;
    }
    const bucketItems = groups.get(ref.bucket) ?? [];
    bucketItems.push({ index, path: ref.path });
    groups.set(ref.bucket, bucketItems);
  });

  await Promise.all(
    Array.from(groups.entries()).map(async ([bucket, items]) => {
      const paths = items.map((i) => i.path);
      const { data, error } = await supabasePublic.storage
        .from(bucket)
        .createSignedUrls(paths, SIGN_TTL_SECONDS);
      if (error || !data) return;
      data.forEach((entry, i) => {
        const item = items[i];
        if (entry?.signedUrl) {
          cache.set(`${bucket}/${item.path}`, entry.signedUrl);
          results[item.index] = entry.signedUrl;
        }
      });
    }),
  );

  return results;
}
