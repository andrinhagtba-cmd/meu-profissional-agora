import { supabase } from "@/integrations/supabase/client";
import { getMediaUrl, getMediaUrls, type MediaRef } from "./mediaService";

const BUCKET = "professional-media";

export type MediaUsage = "avatar" | "cover" | "portfolio";

export interface UploadResult {
  mediaId: string;
  bucket: string;
  path: string;
  url: string;
}

function extFromName(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "bin";
}

async function uploadFile(
  userId: string,
  usage: MediaUsage,
  file: File,
): Promise<UploadResult> {
  const ext = extFromName(file.name);
  const path = `${userId}/${usage}/${crypto.randomUUID()}.${ext}`;

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
      uploaded_by: userId,
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

export interface MyProfile {
  id: string;
  slug: string | null;
  professional_name: string | null;
  business_name: string | null;
  avatar_media_id: string | null;
  cover_media_id: string | null;
  avatar_url: string;
  cover_url: string;
}

async function fetchAssetRefs(ids: string[]) {
  if (!ids.length) return new Map<string, { bucket: string; path: string }>();
  const { data } = await supabase
    .from("media_assets")
    .select("id, bucket_name, object_path")
    .in("id", ids);
  const map = new Map<string, { bucket: string; path: string }>();
  (data ?? []).forEach((r: any) =>
    map.set(r.id, { bucket: r.bucket_name, path: r.object_path }),
  );
  return map;
}

export async function getMyProfessionalProfile(
  userId: string,
): Promise<MyProfile | null> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      "id, slug, professional_name, business_name, avatar_media_id, cover_media_id",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const ids = [data.avatar_media_id, data.cover_media_id].filter(
    Boolean,
  ) as string[];
  const assets = await fetchAssetRefs(ids);
  const avatarRef = data.avatar_media_id ? assets.get(data.avatar_media_id) : null;
  const coverRef = data.cover_media_id ? assets.get(data.cover_media_id) : null;

  const [avatar_url, cover_url] = await Promise.all([
    avatarRef ? getMediaUrl(avatarRef) : Promise.resolve(""),
    coverRef ? getMediaUrl(coverRef) : Promise.resolve(""),
  ]);

  return {
    id: data.id,
    slug: data.slug,
    professional_name: data.professional_name,
    business_name: data.business_name,
    avatar_media_id: data.avatar_media_id,
    cover_media_id: data.cover_media_id,
    avatar_url,
    cover_url,
  };
}

export async function uploadAvatar(userId: string, professionalId: string, file: File) {
  const res = await uploadFile(userId, "avatar", file);
  const { error } = await supabase
    .from("professional_profiles")
    .update({ avatar_media_id: res.mediaId })
    .eq("id", professionalId);
  if (error) throw error;
  return res;
}

export async function uploadCover(userId: string, professionalId: string, file: File) {
  const res = await uploadFile(userId, "cover", file);
  const { error } = await supabase
    .from("professional_profiles")
    .update({ cover_media_id: res.mediaId })
    .eq("id", professionalId);
  if (error) throw error;
  return res;
}

export interface PortfolioItemVM {
  id: string;
  title: string | null;
  description: string | null;
  media_asset_id: string | null;
  sort_order: number;
  status: string;
  url: string;
}

export async function listPortfolio(
  professionalId: string,
): Promise<PortfolioItemVM[]> {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("id, title, description, media_asset_id, sort_order, status")
    .eq("professional_id", professionalId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const ids = rows.map((r) => r.media_asset_id).filter(Boolean) as string[];
  const assets = await fetchAssetRefs(ids);
  const refs: MediaRef[] = rows.map((r) =>
    r.media_asset_id ? assets.get(r.media_asset_id) ?? null : null,
  );
  const urls = await getMediaUrls(refs);

  return rows.map((r, i) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    media_asset_id: r.media_asset_id,
    sort_order: r.sort_order ?? 0,
    status: r.status ?? "active",
    url: urls[i] ?? "",
  }));
}

export async function addPortfolioItem(
  userId: string,
  professionalId: string,
  title: string,
  file: File,
  description?: string,
) {
  const res = await uploadFile(userId, "portfolio", file);
  const { error } = await supabase.from("portfolio_items").insert({
    professional_id: professionalId,
    title,
    description: description ?? null,
    media_asset_id: res.mediaId,
    image_url: res.url || res.path,
    sort_order: 0,
    status: "active",
  });
  if (error) throw error;
  return res;
}

export async function deletePortfolioItem(itemId: string) {
  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId);
  if (error) throw error;
}

export async function getProfessionalPublicMediaBySlug(slug: string) {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("id, slug, avatar_media_id, cover_media_id")
    .eq("slug", slug)
    .eq("profile_status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const ids = [data.avatar_media_id, data.cover_media_id].filter(
    Boolean,
  ) as string[];
  const assets = await fetchAssetRefs(ids);
  const [avatarUrl, coverUrl, portfolio] = await Promise.all([
    data.avatar_media_id
      ? getMediaUrl(assets.get(data.avatar_media_id))
      : Promise.resolve(""),
    data.cover_media_id
      ? getMediaUrl(assets.get(data.cover_media_id))
      : Promise.resolve(""),
    listPortfolio(data.id),
  ]);
  return {
    id: data.id,
    avatarUrl,
    coverUrl,
    portfolio: portfolio.filter((p) => p.status === "active"),
  };
}
