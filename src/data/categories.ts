import type { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "c1",
    slug: "eletricista",
    name: "Eletricista",
    imageKey: "eletricista",
    professionalsCount: 342,
    rating: 4.8,
    priceFrom: 120,
    badge: "Mais procurado",
    description:
      "Instalações, reparos e manutenção elétrica residencial e comercial com profissionais qualificados e avaliados por clientes reais.",
    services: [
      "Instalação de chuveiro",
      "Troca de disjuntores",
      "Instalação de luminárias",
      "Revisão elétrica completa",
      "Instalação de tomadas",
    ],
    faqs: [
      {
        question: "Quanto custa uma visita de eletricista?",
        answer:
          "Muitos profissionais oferecem orçamento sem compromisso. O valor da visita varia conforme a região e a complexidade do serviço.",
      },
      {
        question: "Os eletricistas atendem emergências?",
        answer:
          "Sim, vários profissionais da plataforma oferecem atendimento emergencial. Use o filtro de atendimento emergencial na busca.",
      },
      {
        question: "Como sei se o profissional é confiável?",
        answer:
          "Verifique o selo de verificação, a nota média e as avaliações de clientes anteriores no perfil de cada profissional.",
      },
    ],
  },
  {
    id: "c2",
    slug: "encanador",
    name: "Encanador",
    imageKey: "encanador",
    professionalsCount: 287,
    rating: 4.7,
    priceFrom: 100,
    badge: "Resposta rápida",
    description:
      "Reparos hidráulicos, desentupimentos, vazamentos e instalações com encanadores experientes na sua região.",
    services: [
      "Reparo de vazamentos",
      "Desentupimento",
      "Instalação de torneiras",
      "Troca de registros",
      "Instalação de caixa d'água",
    ],
    faqs: [
      {
        question: "O encanador cobra pela visita?",
        answer:
          "Depende do profissional. Muitos oferecem avaliação gratuita do problema antes de fechar o orçamento.",
      },
      {
        question: "Atendem vazamentos de emergência?",
        answer: "Sim, use o filtro de atendimento emergencial para encontrar quem atende hoje.",
      },
    ],
  },
  {
    id: "c3",
    slug: "pintor",
    name: "Pintor",
    imageKey: "pintor",
    professionalsCount: 198,
    rating: 4.8,
    priceFrom: 350,
    badge: "Recomendado",
    description:
      "Pintura residencial e comercial, textura, grafiato e efeitos decorativos com pintores bem avaliados.",
    services: [
      "Pintura de apartamento",
      "Pintura de fachada",
      "Textura e grafiato",
      "Pintura de portas e janelas",
      "Massa corrida",
    ],
    faqs: [
      {
        question: "Como é calculado o preço da pintura?",
        answer:
          "Normalmente por metro quadrado, considerando o estado das paredes, tipo de tinta e acabamento desejado.",
      },
      {
        question: "O material está incluso no orçamento?",
        answer: "Varia por profissional. Peça orçamentos com e sem material para comparar.",
      },
    ],
  },
  {
    id: "c4",
    slug: "diarista",
    name: "Diarista",
    imageKey: "diarista",
    professionalsCount: 456,
    rating: 4.9,
    priceFrom: 150,
    badge: "Disponível hoje",
    description:
      "Limpeza residencial e comercial, faxina pesada, pós-obra e limpeza recorrente com profissionais de confiança.",
    services: [
      "Faxina completa",
      "Limpeza pós-obra",
      "Limpeza de escritório",
      "Passadoria",
      "Limpeza pré-mudança",
    ],
    faqs: [
      {
        question: "Quanto custa uma diária?",
        answer:
          "O valor varia conforme a cidade, o tamanho do imóvel e o tipo de limpeza. Em geral parte de R$ 150 por diária.",
      },
      {
        question: "Preciso fornecer os produtos de limpeza?",
        answer:
          "Combine diretamente com a profissional. Algumas levam os próprios produtos mediante acréscimo.",
      },
    ],
  },
  {
    id: "c5",
    slug: "informatica",
    name: "Técnico de informática",
    imageKey: "informatica",
    professionalsCount: 164,
    rating: 4.7,
    priceFrom: 90,
    badge: "Atende online",
    description:
      "Manutenção de computadores e notebooks, formatação, redes, remoção de vírus e suporte remoto.",
    services: [
      "Formatação de computador",
      "Remoção de vírus",
      "Configuração de rede Wi-Fi",
      "Troca de peças",
      "Suporte remoto",
    ],
    faqs: [
      {
        question: "O atendimento pode ser online?",
        answer:
          "Sim, muitos técnicos oferecem suporte remoto para problemas de software e configuração.",
      },
      {
        question: "Fazem orçamento antes do conserto?",
        answer: "Sim, o diagnóstico com orçamento prévio é prática comum entre os técnicos.",
      },
    ],
  },
  {
    id: "c6",
    slug: "pedreiro",
    name: "Pedreiro",
    imageKey: "pedreiro",
    professionalsCount: 231,
    rating: 4.6,
    priceFrom: 200,
    description:
      "Reformas, alvenaria, revestimentos, pequenos reparos e construção com pedreiros experientes.",
    services: [
      "Assentamento de piso",
      "Construção de muro",
      "Reboco e acabamento",
      "Pequenas reformas",
      "Instalação de revestimentos",
    ],
    faqs: [
      {
        question: "Como funciona o orçamento de uma reforma?",
        answer:
          "Descreva o serviço com fotos e medidas. O profissional pode agendar uma visita técnica para detalhar o orçamento.",
      },
    ],
  },
  {
    id: "c7",
    slug: "montador",
    name: "Montador de móveis",
    imageKey: "montador",
    professionalsCount: 189,
    rating: 4.8,
    priceFrom: 80,
    badge: "Resposta rápida",
    description:
      "Montagem e desmontagem de móveis planejados e de loja, com agilidade e cuidado.",
    services: [
      "Montagem de guarda-roupa",
      "Montagem de cozinha",
      "Desmontagem para mudança",
      "Instalação de prateleiras",
      "Ajustes e reparos em móveis",
    ],
    faqs: [
      {
        question: "Quanto custa montar um guarda-roupa?",
        answer:
          "Depende do tamanho e da complexidade. Móveis de 2 portas partem de R$ 80; planejados são orçados por projeto.",
      },
    ],
  },
  {
    id: "c8",
    slug: "marido-de-aluguel",
    name: "Marido de aluguel",
    imageKey: "marido-de-aluguel",
    professionalsCount: 274,
    rating: 4.7,
    priceFrom: 100,
    badge: "Mais procurado",
    description:
      "Pequenos reparos em geral: instalações, fixações, ajustes e manutenções do dia a dia.",
    services: [
      "Instalação de suporte de TV",
      "Fixação de quadros e prateleiras",
      "Troca de fechaduras",
      "Reparos em portas e janelas",
      "Instalação de varal",
    ],
    faqs: [
      {
        question: "Que tipos de serviço estão inclusos?",
        answer:
          "Pequenos reparos e instalações em geral. Para serviços elétricos ou hidráulicos complexos, busque um especialista.",
      },
    ],
  },
  {
    id: "c9",
    slug: "mecanico",
    name: "Mecânico",
    imageKey: "mecanico",
    professionalsCount: 143,
    rating: 4.6,
    priceFrom: 150,
    description:
      "Manutenção automotiva, revisões, freios, suspensão e diagnóstico com mecânicos de confiança.",
    services: [
      "Revisão completa",
      "Troca de óleo",
      "Freios e suspensão",
      "Diagnóstico eletrônico",
      "Atendimento em domicílio",
    ],
    faqs: [
      {
        question: "O mecânico atende em domicílio?",
        answer:
          "Alguns profissionais fazem atendimento móvel para serviços leves. Verifique no perfil do profissional.",
      },
    ],
  },
  {
    id: "c10",
    slug: "ar-condicionado",
    name: "Técnico de ar-condicionado",
    imageKey: "ar-condicionado",
    professionalsCount: 156,
    rating: 4.8,
    priceFrom: 180,
    badge: "Disponível hoje",
    description:
      "Instalação, limpeza, higienização e manutenção de ar-condicionado split e janela.",
    services: [
      "Instalação de split",
      "Higienização completa",
      "Carga de gás",
      "Manutenção preventiva",
      "Conserto de placas",
    ],
    faqs: [
      {
        question: "Com que frequência devo higienizar o ar-condicionado?",
        answer:
          "A recomendação geral é a cada 6 meses para uso residencial e a cada 3 meses para uso comercial.",
      },
    ],
  },
];

// Legacy `cities` removida — a plataforma atende exclusivamente o DF.
// Use `DF_REGIONS` / `DF_REGION_NAMES` de "@/data/dfRegions".

