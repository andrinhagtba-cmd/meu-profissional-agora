// Fonte única das 35 Regiões Administrativas oficiais do Distrito Federal.
// Usada em: pedido de orçamento, filtros públicos, cadastros e validação backend.

export interface DfRegion {
  slug: string;
  name: string;
  /** RA oficial (DF) ou UF do município (Entorno) */
  raNumber: string;
  /** termos alternativos de busca (bairros/quadras conhecidas), ignoram acento/caixa */
  aliases: string[];
  /** grupo de exibição */
  group?: "DF" | "Entorno";
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
].map((r) => ({ ...r, group: "DF" as const })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

// Municípios do Entorno do DF (RIDE) — Goiás e Minas Gerais.
export const ENTORNO_REGIONS: DfRegion[] = [
  { slug: "abadiania-go", name: "Abadiânia (GO)", raNumber: "GO", aliases: ["abadiania"] },
  { slug: "agua-fria-de-goias-go", name: "Água Fria de Goiás (GO)", raNumber: "GO", aliases: ["agua fria"] },
  { slug: "aguas-lindas-de-goias-go", name: "Águas Lindas de Goiás (GO)", raNumber: "GO", aliases: ["aguas lindas"] },
  { slug: "alexania-go", name: "Alexânia (GO)", raNumber: "GO", aliases: ["alexania"] },
  { slug: "alto-paraiso-de-goias-go", name: "Alto Paraíso de Goiás (GO)", raNumber: "GO", aliases: ["alto paraiso"] },
  { slug: "alvorada-do-norte-go", name: "Alvorada do Norte (GO)", raNumber: "GO", aliases: [] },
  { slug: "arinos-mg", name: "Arinos (MG)", raNumber: "MG", aliases: [] },
  { slug: "barro-alto-go", name: "Barro Alto (GO)", raNumber: "GO", aliases: [] },
  { slug: "buritis-mg", name: "Buritis (MG)", raNumber: "MG", aliases: [] },
  { slug: "cabeceira-grande-mg", name: "Cabeceira Grande (MG)", raNumber: "MG", aliases: [] },
  { slug: "cabeceiras-go", name: "Cabeceiras (GO)", raNumber: "GO", aliases: [] },
  { slug: "cavalcante-go", name: "Cavalcante (GO)", raNumber: "GO", aliases: [] },
  { slug: "cidade-ocidental-go", name: "Cidade Ocidental (GO)", raNumber: "GO", aliases: ["ocidental"] },
  { slug: "cocalzinho-de-goias-go", name: "Cocalzinho de Goiás (GO)", raNumber: "GO", aliases: ["cocalzinho"] },
  { slug: "corumba-de-goias-go", name: "Corumbá de Goiás (GO)", raNumber: "GO", aliases: ["corumba"] },
  { slug: "cristalina-go", name: "Cristalina (GO)", raNumber: "GO", aliases: [] },
  { slug: "flores-de-goias-go", name: "Flores de Goiás (GO)", raNumber: "GO", aliases: [] },
  { slug: "formosa-go", name: "Formosa (GO)", raNumber: "GO", aliases: [] },
  { slug: "luziania-go", name: "Luziânia (GO)", raNumber: "GO", aliases: ["luziania"] },
  { slug: "mimoso-de-goias-go", name: "Mimoso de Goiás (GO)", raNumber: "GO", aliases: [] },
  { slug: "niquelandia-go", name: "Niquelândia (GO)", raNumber: "GO", aliases: [] },
  { slug: "novo-gama-go", name: "Novo Gama (GO)", raNumber: "GO", aliases: ["pedregal"] },
  { slug: "padre-bernardo-go", name: "Padre Bernardo (GO)", raNumber: "GO", aliases: [] },
  { slug: "pirenopolis-go", name: "Pirenópolis (GO)", raNumber: "GO", aliases: ["pirenopolis"] },
  { slug: "planaltina-de-goias-go", name: "Planaltina de Goiás (GO)", raNumber: "GO", aliases: ["brasilinha"] },
  { slug: "santo-antonio-do-descoberto-go", name: "Santo Antônio do Descoberto (GO)", raNumber: "GO", aliases: ["descoberto"] },
  { slug: "sao-joao-dalianca-go", name: "São João d'Aliança (GO)", raNumber: "GO", aliases: ["sao joao alianca"] },
  { slug: "simolandia-go", name: "Simolândia (GO)", raNumber: "GO", aliases: [] },
  { slug: "unai-mg", name: "Unaí (MG)", raNumber: "MG", aliases: ["unai"] },
  { slug: "valparaiso-de-goias-go", name: "Valparaíso de Goiás (GO)", raNumber: "GO", aliases: ["valparaiso"] },
  { slug: "vila-boa-go", name: "Vila Boa (GO)", raNumber: "GO", aliases: [] },
  { slug: "vila-propicio-go", name: "Vila Propício (GO)", raNumber: "GO", aliases: [] },
]
  .map((r) => ({ ...r, group: "Entorno" as const }))
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

/** DF + Entorno — usada em selects, busca e validação. */
export const ALL_REGIONS: DfRegion[] = [...DF_REGIONS, ...ENTORNO_REGIONS];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function searchDfRegions(query: string): DfRegion[] {
  const q = norm(query);
  if (!q) return ALL_REGIONS;
  return ALL_REGIONS.filter((r) => {
    if (norm(r.name).includes(q)) return true;
    if (norm(r.slug).includes(q)) return true;
    return r.aliases.some((a) => norm(a).includes(q));
  });
}

export function findDfRegionByName(name: string | null | undefined): DfRegion | undefined {
  if (!name) return undefined;
  const q = norm(name);
  return (
    ALL_REGIONS.find((r) => norm(r.name) === q) ??
    ALL_REGIONS.find((r) => norm(r.slug) === q) ??
    ALL_REGIONS.find((r) => r.aliases.some((a) => norm(a) === q))
  );
}

export function isValidDfRegionName(name: string | null | undefined): boolean {
  return Boolean(findDfRegionByName(name));
}

export const DF_REGION_NAMES = ALL_REGIONS.map((r) => r.name);

