// Fonte única das 35 Regiões Administrativas oficiais do Distrito Federal.
// Usada em: pedido de orçamento, filtros públicos, cadastros e validação backend.

export interface DfRegion {
  slug: string;
  name: string;
  raNumber: string;
  /** termos alternativos de busca (bairros/quadras conhecidas), ignoram acento/caixa */
  aliases: string[];
}

export const DF_REGIONS: DfRegion[] = [
  { slug: "agua-quente", name: "Água Quente", raNumber: "RA XXXII", aliases: [] },
  { slug: "aguas-claras", name: "Águas Claras", raNumber: "RA XX", aliases: ["arniqueiras"] },
  { slug: "arapoanga", name: "Arapoanga", raNumber: "RA XXXIV", aliases: [] },
  { slug: "arniqueira", name: "Arniqueira", raNumber: "RA XXXIII", aliases: [] },
  { slug: "brazlandia", name: "Brazlândia", raNumber: "RA IV", aliases: [] },
  { slug: "candangolandia", name: "Candangolândia", raNumber: "RA XIX", aliases: [] },
  { slug: "ceilandia", name: "Ceilândia", raNumber: "RA IX", aliases: ["p sul", "p norte", "qnn", "qnp", "qnm"] },
  { slug: "cruzeiro", name: "Cruzeiro", raNumber: "RA XI", aliases: [] },
  { slug: "fercal", name: "Fercal", raNumber: "RA XXXI", aliases: [] },
  { slug: "gama", name: "Gama", raNumber: "RA II", aliases: [] },
  { slug: "guara", name: "Guará", raNumber: "RA X", aliases: ["guara i", "guara ii"] },
  { slug: "itapoa", name: "Itapoã", raNumber: "RA XXVIII", aliases: [] },
  { slug: "jardim-botanico", name: "Jardim Botânico", raNumber: "RA XXVII", aliases: [] },
  { slug: "lago-norte", name: "Lago Norte", raNumber: "RA XVIII", aliases: [] },
  { slug: "lago-sul", name: "Lago Sul", raNumber: "RA XVI", aliases: [] },
  { slug: "nucleo-bandeirante", name: "Núcleo Bandeirante", raNumber: "RA VIII", aliases: [] },
  { slug: "paranoa", name: "Paranoá", raNumber: "RA VII", aliases: [] },
  { slug: "park-way", name: "Park Way", raNumber: "RA XXIV", aliases: [] },
  { slug: "planaltina", name: "Planaltina", raNumber: "RA VI", aliases: [] },
  {
    slug: "plano-piloto",
    name: "Plano Piloto",
    raNumber: "RA I",
    aliases: ["brasilia", "asa sul", "asa norte", "eixo monumental", "setor bancario"],
  },
  { slug: "recanto-das-emas", name: "Recanto das Emas", raNumber: "RA XV", aliases: [] },
  { slug: "riacho-fundo", name: "Riacho Fundo", raNumber: "RA XVII", aliases: [] },
  { slug: "riacho-fundo-ii", name: "Riacho Fundo II", raNumber: "RA XXI", aliases: [] },
  { slug: "samambaia", name: "Samambaia", raNumber: "RA XII", aliases: [] },
  { slug: "santa-maria", name: "Santa Maria", raNumber: "RA XIII", aliases: [] },
  { slug: "sao-sebastiao", name: "São Sebastião", raNumber: "RA XIV", aliases: [] },
  { slug: "scia-estrutural", name: "SCIA/Estrutural", raNumber: "RA XXV", aliases: ["estrutural", "scia"] },
  { slug: "sia", name: "SIA", raNumber: "RA XXIX", aliases: [] },
  { slug: "sobradinho", name: "Sobradinho", raNumber: "RA V", aliases: [] },
  { slug: "sobradinho-ii", name: "Sobradinho II", raNumber: "RA XXVI", aliases: [] },
  {
    slug: "sol-nascente-por-do-sol",
    name: "Sol Nascente e Pôr do Sol",
    raNumber: "RA XXXII",
    aliases: ["sol nascente", "por do sol", "pôr do sol"],
  },
  { slug: "sudoeste-octogonal", name: "Sudoeste/Octogonal", raNumber: "RA XXII", aliases: ["sudoeste", "octogonal"] },
  { slug: "taguatinga", name: "Taguatinga", raNumber: "RA III", aliases: [] },
  { slug: "varjao", name: "Varjão", raNumber: "RA XXIII", aliases: [] },
  { slug: "vicente-pires", name: "Vicente Pires", raNumber: "RA XXX", aliases: [] },
].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function searchDfRegions(query: string): DfRegion[] {
  const q = norm(query);
  if (!q) return DF_REGIONS;
  return DF_REGIONS.filter((r) => {
    if (norm(r.name).includes(q)) return true;
    if (norm(r.slug).includes(q)) return true;
    return r.aliases.some((a) => norm(a).includes(q));
  });
}

export function findDfRegionByName(name: string | null | undefined): DfRegion | undefined {
  if (!name) return undefined;
  const q = norm(name);
  return (
    DF_REGIONS.find((r) => norm(r.name) === q) ??
    DF_REGIONS.find((r) => norm(r.slug) === q) ??
    DF_REGIONS.find((r) => r.aliases.some((a) => norm(a) === q))
  );
}

export function isValidDfRegionName(name: string | null | undefined): boolean {
  return Boolean(findDfRegionByName(name));
}

export const DF_REGION_NAMES = DF_REGIONS.map((r) => r.name);
