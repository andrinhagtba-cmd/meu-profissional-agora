import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { profileWhatsAppCta } from "./floatingWhatsApp";

describe("profile floating WhatsApp", () => {
  test("uses each profile's own contact and personalized CTA", () => {
    const first = profileWhatsAppCta({ slug: "loja-a", name: "Loja A", whatsapp: "61999998888" });
    const second = profileWhatsAppCta({ slug: "loja-b", name: "Loja B", whatsapp: "61988887777" });
    assert.equal(first.href?.split("?")[0], "https://wa.me/5561999998888");
    assert.equal(second.href?.split("?")[0], "https://wa.me/5561988887777");
    assert.ok(new URL(first.href ?? "https://invalid.test").searchParams.get("text")?.includes("Olá, Loja A!"));
    assert.equal(first.label, "Falar com Loja A no WhatsApp");
  });
  test("missing or invalid profile contact never redirects to platform", () => {
    assert.equal(profileWhatsAppCta({ slug: "sem-contato", name: "Loja" }).href, null);
    assert.equal(profileWhatsAppCta({ slug: "invalido", name: "Loja", whatsapp: "123" }).href, null);
  });
});