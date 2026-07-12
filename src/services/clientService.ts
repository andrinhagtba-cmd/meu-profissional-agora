// Camada real (Supabase) para o painel do cliente:
// pedidos (quote_requests), notificações, favoritos e perfil.

import { supabase } from "@/integrations/supabase/client";
import { professionals as mockProfessionals } from "@/data/professionals";
import { getMediaUrl } from "@/services/mediaService";

export type MyQuote = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  state: string;
  neighborhood: string | null;
  urgency: string;
  service_type: string;
  status: string;
  created_at: string;
  category?: { slug: string; name: string } | null;
};

export async function listMyQuotes(userId: string): Promise<MyQuote[]> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `id, title, description, city, state, neighborhood, urgency, service_type, status, created_at,
       category:category_id(slug, name)`,
    )
    .eq("client_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyQuote[];
}

export async function countMyQuotes(userId: string) {
  const { count, error } = await supabase
    .from("quote_requests")
    .select("id", { count: "exact", head: true })
    .eq("client_id", userId);
  if (error) throw error;
  return count ?? 0;
}

// --------------------- Notifications ---------------------

export type MyNotification = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export async function listNotifications(userId: string): Promise<MyNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, link, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as MyNotification[];
}

export async function countUnreadNotifications(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

// --------------------- Favorites ---------------------

export async function listFavoriteProfessionalIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("professional_id")
    .eq("client_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.professional_id as string);
}

export async function listFavoriteProfessionalSlugs(userId: string): Promise<string[]> {
  const ids = await listFavoriteProfessionalIds(userId);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("slug")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []).map((r) => r.slug as string);
}

async function professionalIdFromSlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function addFavoriteBySlug(userId: string, slug: string) {
  const id = await professionalIdFromSlug(slug);
  if (!id) return;
  await supabase.from("favorites").upsert(
    { client_id: userId, professional_id: id },
    { onConflict: "client_id,professional_id", ignoreDuplicates: true },
  );
}

export async function removeFavoriteBySlug(userId: string, slug: string) {
  const id = await professionalIdFromSlug(slug);
  if (!id) return;
  await supabase
    .from("favorites")
    .delete()
    .eq("client_id", userId)
    .eq("professional_id", id);
}

// --------------------- Profile ---------------------

export type MyProfile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  avatar_media_id: string | null;
  avatar_url: string | null;
};

const AVATAR_BUCKET = "professional-media";

function getFileExtension(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "jpg";
}

export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, city, state, avatar_media_id, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  let resolvedAvatarUrl = data.avatar_url ?? null;
  if (data.avatar_media_id) {
    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("bucket_name, object_path")
      .eq("id", data.avatar_media_id)
      .maybeSingle();
    if (assetError) throw assetError;
    if (asset?.bucket_name && asset?.object_path) {
      resolvedAvatarUrl = await getMediaUrl({ bucket: asset.bucket_name, path: asset.object_path });
    }
  }

  return { ...(data as MyProfile), avatar_url: resolvedAvatarUrl };
}

export async function updateMyProfile(
  userId: string,
  patch: Partial<Pick<MyProfile, "full_name" | "phone" | "city" | "state">>,
) {
  const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
  if (error) throw error;

  // Sincroniza com professional_profiles caso o usuário seja profissional,
  // para que o painel admin exiba WhatsApp, cidade, estado e nome.
  const { data: pro } = await supabase
    .from("professional_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (pro?.id) {
    const proPatch: {
      professional_name?: string;
      whatsapp?: string | null;
      city?: string | null;
      state?: string | null;
    } = {};
    if (patch.full_name !== undefined) proPatch.professional_name = patch.full_name ?? "";
    if (patch.phone !== undefined) proPatch.whatsapp = patch.phone ?? null;
    if (patch.city !== undefined) proPatch.city = patch.city ?? null;
    if (patch.state !== undefined) proPatch.state = patch.state ?? null;
    if (Object.keys(proPatch).length > 0) {
      await supabase.from("professional_profiles").update(proPatch).eq("id", pro.id);
    }
  }
}

export async function uploadClientAvatar(userId: string, file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie uma imagem válida para a foto do perfil.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const extension = getFileExtension(file.name);
  const path = `${userId}/avatar/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .insert({
      bucket_name: AVATAR_BUCKET,
      object_path: path,
      original_filename: file.name,
      mime_type: file.type || null,
      file_size_bytes: file.size,
      usage_type: "avatar",
      status: "active",
      uploaded_by: userId,
      source_type: "upload",
    })
    .select("id")
    .single();

  if (assetError || !asset) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    throw assetError ?? new Error("Não foi possível registrar a foto do perfil.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_media_id: asset.id })
    .eq("user_id", userId);

  if (profileError) throw profileError;
  const url = await getMediaUrl({ bucket: AVATAR_BUCKET, path });
  return { mediaId: asset.id, url };
}

// --------------------- Quote submission ---------------------

export type SubmitQuoteInput = {
  categoriaSlug: string;
  servico: string; // usado como título
  descricao: string;
  cidade: string;
  bairro?: string;
  urgencia: string;
  serviceType?: "residencial" | "empresarial" | "online";
  professionalSlug?: string;
};

export async function submitQuoteToDb(userId: string, input: SubmitQuoteInput) {
  let categoryId: string | null = null;
  if (input.categoriaSlug) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", input.categoriaSlug)
      .maybeSingle();
    categoryId = data?.id ?? null;
  }

  // Se veio direcionado a um profissional específico, resolve o id + valida perfil ativo.
  let selectedProId: string | null = null;
  if (input.professionalSlug) {
    const { data: pro } = await supabase
      .from("professional_profiles")
      .select("id, profile_status")
      .eq("slug", input.professionalSlug)
      .maybeSingle();
    if (pro && pro.profile_status === "published") {
      selectedProId = pro.id as string;
    }
  }

  const [city, state] = input.cidade.split(",").map((s) => s.trim());

  const { data, error } = await supabase
    .from("quote_requests")
    .insert({
      client_id: userId,
      category_id: categoryId,
      title: input.servico,
      description: input.descricao,
      city: city || input.cidade,
      state: state || "SP",
      neighborhood: input.bairro || null,
      urgency: input.urgencia as
        | "hoje"
        | "esta-semana"
        | "data"
        | "sem-urgencia",
      service_type: (input.serviceType ?? "residencial") as
        | "residencial"
        | "empresarial"
        | "online",
      status: selectedProId ? "professional_selected" : "open",
      selected_professional_id: selectedProId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    protocol: `OR-${data.id.slice(0, 6).toUpperCase()}`,
    directToProfessional: Boolean(selectedProId),
  };
}

// --------------------- Helpers ---------------------

const mockBySlug = new Map(mockProfessionals.map((p) => [p.slug, p]));
export function findMockProfessionalBySlug(slug: string) {
  return mockBySlug.get(slug);
}

// --------------------- Propostas recebidas ---------------------

export type QuoteDetail = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  state: string;
  neighborhood: string | null;
  urgency: string;
  service_type: string;
  status: string;
  created_at: string;
  selected_professional_id: string | null;
  category?: { slug: string; name: string } | null;
};

export async function getMyQuote(id: string): Promise<QuoteDetail | null> {
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `id, title, description, city, state, neighborhood, urgency, service_type,
       status, created_at, selected_professional_id,
       category:category_id(slug, name)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as QuoteDetail | null) ?? null;
}

export type ReceivedProposal = {
  id: string;
  message: string | null;
  estimated_price: number | null;
  price_type: string | null;
  estimated_deadline: string | null;
  status: string;
  created_at: string;
  professional?: {
    id: string;
    slug: string | null;
    professional_name: string | null;
    business_name: string | null;
    city: string | null;
    state: string | null;
    average_rating: number | null;
    reviews_count: number | null;
    verification_status: string | null;
  } | null;
};

export async function listProposalsForQuote(
  quoteId: string,
): Promise<ReceivedProposal[]> {
  const { data, error } = await supabase
    .from("quote_proposals")
    .select(
      `id, message, estimated_price, price_type, estimated_deadline, status, created_at,
       professional:professional_id(id, slug, professional_name, business_name,
         city, state, average_rating, reviews_count, verification_status)`,
    )
    .eq("quote_request_id", quoteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReceivedProposal[];
}

export async function acceptProposalRpc(proposalId: string) {
  const { error } = await supabase.rpc("accept_proposal", { _proposal_id: proposalId });
  if (error) throw error;
}

export async function rejectProposalRpc(proposalId: string) {
  const { error } = await supabase.rpc("reject_proposal", { _proposal_id: proposalId });
  if (error) throw error;
}

// --------------------- Status history & updates ---------------------

export type QuoteHistoryEntry = {
  id: string;
  from_status: string | null;
  to_status: string;
  actor_role: string | null;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

export async function getQuoteHistory(quoteId: string): Promise<QuoteHistoryEntry[]> {
  const { data, error } = await supabase
    .from("quote_status_history")
    .select("id, from_status, to_status, actor_role, changed_by, note, created_at")
    .eq("quote_request_id", quoteId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as QuoteHistoryEntry[];
}

export async function updateQuoteStatus(
  quoteId: string,
  newStatus: "in_progress" | "completed" | "cancelled",
  note?: string,
) {
  const payload: { _quote_id: string; _new_status: string; _note?: string } = {
    _quote_id: quoteId,
    _new_status: newStatus,
  };
  if (note) payload._note = note;
  const { error } = await supabase.rpc("update_quote_status", payload);
  if (error) throw error;
}

