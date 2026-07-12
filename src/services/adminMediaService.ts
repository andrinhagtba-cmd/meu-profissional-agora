import { supabase } from "@/integrations/supabase/client";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { getMediaUrl } from "./mediaService";

const BUCKET = "public-media";

export interface AdminUploadResult {
  mediaId: string;
  bucket: string;
  path: string;
  url: string;
}

function extFromName(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "bin";
}

/**
 * Upload an image to the public-media bucket and register it in media_assets.
 * Requires the caller to be admin (RLS enforces it).
 */
export async function uploadAdminMedia(
  file: File,
  usage: "category-cover" | "service-cover" | "banner" | "general" = "general",
): Promise<AdminUploadResult> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Não autenticado");

  const ext = extFromName(file.name);
  const path = `${usage}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: "3600",
    });
  if (upErr) throw upErr;

  const { data: asset, error: insErr } = await supabase
    .from("media_assets")
    .insert({
      bucket_name: BUCKET,
      object_path: path,
      original_filename: file.name,
      mime_type: file.type || null,
      file_size_bytes: file.size,
      usage_type: usage,
      status: "active",
      uploaded_by: userData.user.id,
      source_type: "upload",
    })
    .select("id")
    .single();

  if (insErr || !asset) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw insErr ?? new Error("Falha ao registrar mídia");
  }

  const url = await getMediaUrl({ bucket: BUCKET, path });
  return { mediaId: asset.id, bucket: BUCKET, path, url };
}

/** Batch resolve URLs from media_asset ids. */
export async function resolveMediaUrlsByIds(
  ids: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean) as string[]));
  const map = new Map<string, string>();
  if (!unique.length) return map;
  // Use the isolated anon client so an expired auth session on the shared
  // client can't 401 this public read (avatars/covers on public cards).
  const { data } = await supabasePublic
    .from("media_assets")
    .select("id, bucket_name, object_path")
    .in("id", unique);
  await Promise.all(
    (data ?? []).map(async (r: any) => {
      const url = await getMediaUrl({ bucket: r.bucket_name, path: r.object_path });
      if (url) map.set(r.id, url);
    }),
  );
  return map;
}
