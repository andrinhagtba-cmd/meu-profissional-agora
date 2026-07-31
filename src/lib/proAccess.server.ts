// Operações privilegiadas de acesso do profissional (service role).
// Nunca importar este arquivo em código do cliente.

import { supabaseAdmin } from "@/lib/supabaseAdmin.server";

export function generatePassword(len = 12) {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const target = email.toLowerCase();
  const { data: prof } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .ilike("email", target)
    .maybeSingle();
  if (prof?.user_id) return prof.user_id as string;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

export async function createProfessionalAccess(input: {
  professionalId: string;
  email: string;
  password?: string | null;
  fullName?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");

  const { data: pro, error: proErr } = await supabaseAdmin
    .from("professional_profiles")
    .select("id, user_id, professional_name, business_name, city, state, whatsapp")
    .eq("id", input.professionalId)
    .maybeSingle();
  if (proErr) throw new Error(proErr.message);
  if (!pro) throw new Error("Profissional não encontrado.");

  const password = input.password?.trim() || generatePassword();
  const fullName = input.fullName?.trim() || pro.professional_name || pro.business_name || email;

  let userId = await findUserIdByEmail(email);
  let created = false;

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "profissional", city: pro.city, state: pro.state, phone: pro.whatsapp },
    });
    if (error) throw new Error(error.message);
    userId = data.user.id;
    created = true;
  } else {
    // Conta já existente: aplica a senha (informada ou gerada) para que o
    // administrador sempre tenha credenciais válidas para entregar.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (error) throw new Error(error.message);
  }

  // Vincula perfil público, papel e conta
  await supabaseAdmin.from("profiles").upsert(
    { user_id: userId, email, full_name: fullName, city: pro.city, state: pro.state, phone: pro.whatsapp },
    { onConflict: "user_id" },
  );
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: userId, role: "profissional" },
    { onConflict: "user_id,role", ignoreDuplicates: true },
  );

  if (pro.user_id && pro.user_id !== userId) {
    throw new Error("Este profissional já está vinculado a outra conta de usuário.");
  }
  if (!pro.user_id) {
    // O trigger de signup cria automaticamente um perfil profissional vazio.
    // Removemos esse rascunho para poder vincular o perfil real (user_id é único).
    const { data: autoRows, error: autoErr } = await supabaseAdmin
      .from("professional_profiles")
      .select("id, slug, profile_status, business_name, description, source")
      .eq("user_id", userId)
      .neq("id", input.professionalId);
    if (autoErr) throw new Error(autoErr.message);

    for (const row of autoRows ?? []) {
      const isEmptyDraft =
        row.profile_status === "draft" && !row.slug && !row.business_name && !row.description;
      if (!isEmptyDraft) {
        throw new Error("Esta conta já está vinculada a outro perfil profissional.");
      }
      const { error } = await supabaseAdmin
        .from("professional_profiles")
        .delete()
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    }

    const { error } = await supabaseAdmin
      .from("professional_profiles")
      .update({ user_id: userId })
      .eq("id", input.professionalId);
    if (error) throw new Error(error.message);
  }

  return { userId, email, created, password };
}

export async function resetProfessionalPassword(input: { userId: string; password?: string | null }) {
  const password = input.password?.trim() || generatePassword();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(input.userId, { password });
  if (error) throw new Error(error.message);
  return { password };
}

export async function updateProfessionalEmail(input: { userId: string; email: string }) {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");

  const existing = await findUserIdByEmail(email);
  if (existing && existing !== input.userId) {
    throw new Error("Este e-mail já está em uso por outra conta.");
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(input.userId, {
    email,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("profiles").update({ email }).eq("user_id", input.userId);

  return { email };
}

export async function getProfessionalAccountDetails(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) throw new Error(error.message);
  const user = data.user;
  if (!user) throw new Error("Conta não encontrada.");

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name, phone, city, state, avatar_url, account_status, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
  ]);

  return {
    userId,
    email: user.email ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at),
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    provider: (user.app_metadata?.provider as string | undefined) ?? "email",
    fullName: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    accountStatus: (profile?.account_status as string | null) ?? null,
    roles: (roles ?? []).map((r) => r.role as string),
  };
}
