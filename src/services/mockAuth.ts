// AUTENTICAÇÃO SIMULADA (MOCK) — apenas para navegação no protótipo.
// Substituir por integração real na fase de backend.

import type { MockUser, UserRole } from "@/types";

const KEY = "proconecta:mock-auth";

export function mockLogin(role: UserRole, email: string): MockUser {
  const names: Record<UserRole, string> = {
    cliente: "Mariana Teixeira",
    profissional: "Carlos Mendes",
    admin: "Administrador",
  };
  const user: MockUser = { name: names[role], email, role };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(user));
  }
  return user;
}

export function mockLogout() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(KEY);
  }
}

export function getMockUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}
