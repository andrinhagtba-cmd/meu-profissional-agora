import { describe, expect, test } from "bun:test";
import { profileWhatsAppCta } from "./floatingWhatsApp";

describe("profile floating WhatsApp", () => {
  test("uses each profile's own contact and personalized CTA", () => {
    const first = profileWhatsAppCta({ slug: "loja-a", name: "Loja A", whatsapp: "61999998888" });
    const second = profileWhatsAppCta({ slug: "loja-b", name: "Loja B", whatsapp: "61988887777" });
    expect(first.href?.split("?")[0]).toBe("https://wa.me/5561999998888");
    expect(second.href?.split("?")[0]).toBe("https://wa.me/5561988887777");
    expect(new URL(first.href ?? "https://invalid.test").searchParams.get("text")).toContain("Olá, Loja A!");
    expect(first.label).toBe("Falar com Loja A no WhatsApp");
  });
  test("missing or invalid profile contact never redirects to platform", () => {
    expect(profileWhatsAppCta({ slug: "sem-contato", name: "Loja" }).href).toBeNull();
    expect(profileWhatsAppCta({ slug: "invalido", name: "Loja", whatsapp: "123" }).href).toBeNull();
  });
});