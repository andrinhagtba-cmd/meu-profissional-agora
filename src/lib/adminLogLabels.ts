const ACTION_LABELS: Record<string, string> = {
  update_initial_view_count: "Ajuste do contador de visualizações",
  update_profile: "Perfil atualizado",
  update_professional: "Perfil atualizado",
  create_professional: "Profissional cadastrado",
  delete_professional: "Profissional removido",
  toggle_featured: "Destaque alterado",
  update_verification: "Verificação atualizada",
  update_status: "Status alterado",
  assign_subscription: "Plano atribuído",
  delete_subscription: "Assinatura removida",
  create_pro_access: "Credenciais de acesso criadas",
  reset_pro_password: "Senha do profissional redefinida",
  approve_photo: "Foto aprovada",
  reject_photo: "Foto recusada",
};

const FIELD_LABELS: Record<string, string> = {
  old: "antes",
  new: "depois",
  reason: "motivo",
  status: "status",
  email: "e-mail",
  plan_id: "plano",
  value: "valor",
  field: "campo",
};

/** Nome amigável em português para uma ação registrada no log administrativo. */
export function adminActionLabel(action: string) {
  const key = (action || "").toLowerCase();
  if (ACTION_LABELS[key]) return ACTION_LABELS[key];
  const pretty = key.replace(/_/g, " ").trim();
  return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : "Ação administrativa";
}

/** Converte o metadata JSON do log em um texto legível ("antes: 0 · depois: 630"). */
export function adminActionDetails(metadata: unknown): string | null {
  if (metadata == null) return null;
  if (typeof metadata === "string") return metadata.trim() || null;
  if (typeof metadata !== "object") return String(metadata);

  const parts: string[] = [];
  for (const [rawKey, rawValue] of Object.entries(metadata as Record<string, unknown>)) {
    if (rawValue === null || rawValue === undefined || rawValue === "") continue;
    const label = FIELD_LABELS[rawKey] ?? rawKey.replace(/_/g, " ");
    const value =
      typeof rawValue === "boolean"
        ? rawValue ? "sim" : "não"
        : typeof rawValue === "object"
          ? JSON.stringify(rawValue)
          : String(rawValue);
    parts.push(`${label}: ${value}`);
  }
  return parts.length ? parts.join(" · ") : null;
}
