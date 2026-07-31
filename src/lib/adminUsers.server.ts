// Operações privilegiadas de exclusão de usuários (service role).
// Nunca importar este arquivo em código do cliente.

import { supabaseAdmin } from "@/lib/supabaseAdmin.server";

export async function deleteUserAccount(userId: string) {
  // Desvincula o profissional (se houver) para não quebrar FKs
  await supabaseAdmin
    .from("professional_profiles")
    .update({ user_id: null })
    .eq("user_id", userId);

  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error && !/not found/i.test(error.message)) throw new Error(error.message);

  return { userId };
}
