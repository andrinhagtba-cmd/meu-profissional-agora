import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Não autorizado.");
}

export const createProAccessFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { professionalId: string; email: string; password?: string | null; fullName?: string | null }) => ({
    professionalId: String(data.professionalId),
    email: String(data.email ?? "").slice(0, 200),
    password: data.password ? String(data.password).slice(0, 100) : null,
    fullName: data.fullName ? String(data.fullName).slice(0, 200) : null,
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { createProfessionalAccess } = await import("./proAccess.server");
    return createProfessionalAccess(data);
  });

export const resetProPasswordFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; password?: string | null }) => ({
    userId: String(data.userId),
    password: data.password ? String(data.password).slice(0, 100) : null,
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { resetProfessionalPassword } = await import("./proAccess.server");
    return resetProfessionalPassword(data);
  });

export const updateProEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; email: string }) => ({
    userId: String(data.userId),
    email: String(data.email ?? "").slice(0, 200),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { updateProfessionalEmail } = await import("./proAccess.server");
    return updateProfessionalEmail(data);
  });

export const getProAccountDetailsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => ({ userId: String(data.userId) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { getProfessionalAccountDetails } = await import("./proAccess.server");
    return getProfessionalAccountDetails(data.userId);
  });

