import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { basename } from "path";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("missing supabase env");
const supa = createClient(url, key, { auth: { persistSession: false } });

// slug -> { name, badge, badge_variant, file, alt, order }
const categoryPlan = [
  { slug: "eletricista", name: "Eletricista",
    file: "src/assets/cat-eletricista.jpg", alt: "Eletricista realizando manutenção em quadro elétrico residencial.",
    badge: "Mais procurado", badge_variant: "orange", order: 1,
    description: "Instalações, reparos e manutenção elétrica residencial e comercial com profissionais qualificados e avaliados por clientes reais." },
  { slug: "encanador", name: "Encanador",
    file: "src/assets/cat-encanador.jpg", alt: "Encanador realizando reparo em tubulação de pia.",
    badge: "Resposta rápida", badge_variant: "orange", order: 2,
    description: "Reparos hidráulicos, desentupimentos, vazamentos e instalações com encanadores experientes na sua região." },
  { slug: "pintor", name: "Pintor",
    file: "src/assets/cat-pintor.jpg", alt: "Profissional aplicando tinta em parede residencial.",
    badge: "Recomendado", badge_variant: "orange", order: 3,
    description: "Pintura residencial e comercial, textura, grafiato e efeitos decorativos com pintores bem avaliados." },
  { slug: "diarista", name: "Diarista",
    file: "src/assets/cat-diarista.jpg", alt: "Profissional de limpeza em ambiente residencial.",
    badge: "Disponível hoje", badge_variant: "orange", order: 4,
    description: "Limpeza residencial e comercial, faxina pesada, pós-obra e limpeza recorrente com profissionais de confiança." },
  { slug: "informatica", name: "Técnico de informática",
    file: "src/assets/cat-informatica.jpg", alt: "Técnico realizando manutenção em computador.",
    badge: "Atende online", badge_variant: "orange", order: 5,
    description: "Manutenção de computadores e notebooks, formatação, redes, remoção de vírus e suporte remoto." },
  { slug: "pedreiro", name: "Pedreiro",
    file: "src/assets/cat-pedreiro.jpg", alt: "Pedreiro assentando revestimento em parede.",
    badge: null, badge_variant: null, order: 6,
    description: "Reformas, alvenaria, revestimentos, pequenos reparos e construção com pedreiros experientes." },
  { slug: "montador", name: "Montador de móveis",
    file: "src/assets/cat-montador.jpg", alt: "Montador de móveis instalando armário residencial.",
    badge: "Resposta rápida", badge_variant: "orange", order: 7,
    description: "Montagem e desmontagem de móveis planejados e de loja, com agilidade e cuidado." },
  { slug: "marido-de-aluguel", name: "Marido de aluguel",
    file: "src/assets/cat-marido-aluguel.jpg", alt: "Profissional realizando pequenos reparos domésticos.",
    badge: "Mais procurado", badge_variant: "orange", order: 8,
    description: "Pequenos reparos em geral: instalações, fixações, ajustes e manutenções do dia a dia." },
  { slug: "mecanico", name: "Mecânico",
    file: "src/assets/cat-mecanico.jpg", alt: "Mecânico realizando manutenção em veículo.",
    badge: null, badge_variant: null, order: 9,
    description: "Manutenção automotiva, revisões, freios, suspensão e diagnóstico com mecânicos de confiança." },
  { slug: "ar-condicionado", name: "Técnico de ar-condicionado",
    file: "src/assets/cat-ar-condicionado.jpg", alt: "Técnico realizando manutenção em ar-condicionado split.",
    badge: "Disponível hoje", badge_variant: "orange", order: 10,
    description: "Instalação, limpeza, higienização e manutenção de ar-condicionado split e janela." },
];

const institutional = [
  { file: "src/assets/hero.jpg", path: "site/hero/hero-principal.jpg",
    entity_type: "hero", usage_type: "hero-background",
    alt: "Profissionais brasileiros prontos para atender." },
  { file: "src/assets/promo-tools.png", path: "site/promotions/promo-ferramentas.png",
    entity_type: "promotion", usage_type: "banner",
    alt: "Ferramentas profissionais em destaque promocional." },
];

async function upsertMedia({ bucket, path, file, entity_type, entity_id = null, usage_type, alt, mime }) {
  const bytes = readFileSync(file);
  const checksum = createHash("sha256").update(bytes).digest("hex");

  // Already migrated (by checksum)?
  const { data: existing } = await supa
    .from("media_assets")
    .select("id, bucket_name, object_path")
    .eq("checksum", checksum)
    .maybeSingle();

  if (existing) {
    console.log(`skip (already migrated): ${file} -> ${existing.object_path}`);
    return existing.id;
  }

  // Upload
  const up = await supa.storage.from(bucket).upload(path, bytes, {
    contentType: mime,
    upsert: true,
  });
  if (up.error && !String(up.error.message).includes("exists")) {
    throw new Error(`upload ${file}: ${up.error.message}`);
  }

  const { data: inserted, error: insErr } = await supa
    .from("media_assets")
    .upsert(
      {
        bucket_name: bucket,
        object_path: path,
        original_filename: basename(file),
        entity_type,
        entity_id,
        usage_type,
        alt_text: alt,
        mime_type: mime,
        file_size_bytes: bytes.length,
        status: "active",
        source_type: "legacy-frontend",
        legacy_path: file,
        checksum,
      },
      { onConflict: "bucket_name,object_path" }
    )
    .select("id")
    .single();
  if (insErr) throw new Error(`insert media_asset ${path}: ${insErr.message}`);
  console.log(`uploaded ${file} -> ${bucket}/${path}`);
  return inserted.id;
}

// Seed categories
for (const c of categoryPlan) {
  // upsert category by slug
  const { data: cat, error: catErr } = await supa
    .from("categories")
    .upsert(
      {
        slug: c.slug,
        name: c.name,
        description: c.description,
        active: true,
        display_order: c.order,
        image_alt: c.alt,
        badge_text: c.badge,
        badge_variant: c.badge_variant,
        badge_active: c.badge != null,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (catErr) throw new Error(`upsert category ${c.slug}: ${catErr.message}`);

  const mediaId = await upsertMedia({
    bucket: "public-media",
    path: `categories/${c.slug}/card/${c.slug}.jpg`,
    file: c.file,
    entity_type: "category",
    entity_id: cat.id,
    usage_type: "card",
    alt: c.alt,
    mime: "image/jpeg",
  });

  const { error: linkErr } = await supa
    .from("categories")
    .update({ card_media_id: mediaId, cover_media_id: mediaId })
    .eq("id", cat.id);
  if (linkErr) throw new Error(`link media ${c.slug}: ${linkErr.message}`);
  console.log(`category linked: ${c.slug}`);
}

// Institutional
for (const i of institutional) {
  const mime = i.file.endsWith(".png") ? "image/png" : "image/jpeg";
  await upsertMedia({
    bucket: "public-media",
    path: i.path,
    file: i.file,
    entity_type: i.entity_type,
    usage_type: i.usage_type,
    alt: i.alt,
    mime,
  });
}

console.log("done");
