// Dados fictícios dos dashboards — substituir por integração real na fase de backend.

export const clientDashboard = {
  stats: [
    { label: "Solicitações abertas", value: 2 },
    { label: "Propostas recebidas", value: 9 },
    { label: "Profissionais contatados", value: 5 },
    { label: "Serviços concluídos", value: 7 },
  ],
  openRequests: [
    {
      id: "cq1",
      title: "Instalação de chuveiro",
      category: "Eletricista",
      date: "2026-07-09",
      proposals: 4,
      status: "aberta" as const,
    },
    {
      id: "cq2",
      title: "Pintura do quarto do casal",
      category: "Pintor",
      date: "2026-07-05",
      proposals: 5,
      status: "aberta" as const,
    },
  ],
  receivedProposals: [
    {
      id: "pr1",
      professional: "Carlos Mendes",
      professionalSlug: "carlos-mendes-eletricista",
      request: "Instalação de chuveiro",
      value: 150,
      deadline: "Hoje à tarde",
      message: "Posso ir hoje após as 14h. Valor inclui material de fixação.",
    },
    {
      id: "pr2",
      professional: "Luciana Pereira",
      professionalSlug: "luciana-pereira-eletricista",
      request: "Instalação de chuveiro",
      value: 130,
      deadline: "Amanhã de manhã",
      message: "Atendo amanhã às 9h com garantia de 90 dias.",
    },
    {
      id: "pr3",
      professional: "Juliana Costa",
      professionalSlug: "juliana-costa-pintora",
      request: "Pintura do quarto do casal",
      value: 420,
      deadline: "Esta semana",
      message: "Incluso massa corrida em pequenos reparos e proteção completa dos móveis.",
    },
  ],
  completedServices: [
    { id: "cs1", title: "Montagem de guarda-roupa", professional: "Fernanda Lima", date: "2026-06-20", rated: true },
    { id: "cs2", title: "Higienização de split", professional: "Patrícia Moura", date: "2026-06-11", rated: false },
    { id: "cs3", title: "Faxina completa", professional: "Ana Paula Ferreira", date: "2026-05-30", rated: true },
  ],
  notifications: [
    { id: "n1", text: "Carlos Mendes enviou uma proposta para 'Instalação de chuveiro'", time: "há 2 horas", unread: true },
    { id: "n2", text: "Sua avaliação para Ana Paula Ferreira foi publicada", time: "ontem", unread: true },
    { id: "n3", text: "Lembrete: avalie o serviço de Patrícia Moura", time: "há 3 dias", unread: false },
  ],
};

export const proDashboard = {
  stats: [
    { label: "Visualizações do perfil", value: 1284, delta: "+18%" },
    { label: "Cliques no WhatsApp", value: 96, delta: "+12%" },
    { label: "Pedidos de orçamento", value: 31, delta: "+7%" },
    { label: "Taxa de resposta", value: "94%", delta: "+2%" },
    { label: "Avaliação média", value: "4.9", delta: "—" },
    { label: "Oportunidades no mês", value: 42, delta: "+22%" },
  ],
  weeklyViews: [
    { day: "Seg", views: 142, clicks: 9 },
    { day: "Ter", views: 178, clicks: 14 },
    { day: "Qua", views: 165, clicks: 11 },
    { day: "Qui", views: 210, clicks: 17 },
    { day: "Sex", views: 245, clicks: 21 },
    { day: "Sáb", views: 198, clicks: 15 },
    { day: "Dom", views: 146, clicks: 9 },
  ],
  opportunities: [
    { id: "op1", title: "Instalação de chuveiro em Curitiba", category: "Eletricista", distance: "2,4 km", urgency: "Hoje", proposals: 4 },
    { id: "op2", title: "Revisão elétrica de casa comercial", category: "Eletricista", distance: "5,1 km", urgency: "Esta semana", proposals: 2 },
    { id: "op3", title: "Troca de disjuntores em condomínio", category: "Eletricista", distance: "3,8 km", urgency: "Sem urgência", proposals: 6 },
  ],
  sentProposals: [
    { id: "sp1", request: "Instalação de chuveiro", client: "Mariana T.", value: 150, status: "aguardando" as const, date: "2026-07-09" },
    { id: "sp2", request: "Iluminação de sala comercial", client: "Empresa RCT", value: 890, status: "aceita" as const, date: "2026-07-06" },
    { id: "sp3", request: "Troca de tomadas", client: "Eduardo P.", value: 180, status: "recusada" as const, date: "2026-07-02" },
  ],
  leads: [
    { id: "l1", name: "Cliente via WhatsApp", service: "Instalação de luminárias", time: "há 1 hora" },
    { id: "l2", name: "Cliente via perfil", service: "Revisão elétrica", time: "há 4 horas" },
    { id: "l3", name: "Cliente via busca", service: "Instalação de chuveiro", time: "ontem" },
  ],
  agenda: [
    { id: "a1", title: "Instalação de chuveiro — Água Verde", time: "Hoje, 14h" },
    { id: "a2", title: "Visita técnica — loja no Centro", time: "Amanhã, 9h" },
    { id: "a3", title: "Revisão elétrica — Batel", time: "Sex, 8h30" },
  ],
};

export const adminDashboard = {
  stats: [
    { label: "Usuários ativos", value: "12.480", delta: "+6%" },
    { label: "Profissionais", value: "2.315", delta: "+4%" },
    { label: "Solicitações no mês", value: "3.892", delta: "+11%" },
    { label: "Verificações pendentes", value: "23", delta: "—" },
  ],
  monthlyGrowth: [
    { month: "Fev", usuarios: 8200, solicitacoes: 2100 },
    { month: "Mar", usuarios: 9100, solicitacoes: 2480 },
    { month: "Abr", usuarios: 9900, solicitacoes: 2790 },
    { month: "Mai", usuarios: 10800, solicitacoes: 3120 },
    { month: "Jun", usuarios: 11700, solicitacoes: 3560 },
    { month: "Jul", usuarios: 12480, solicitacoes: 3892 },
  ],
  pendingVerifications: [
    { id: "v1", name: "José Santos", category: "Pedreiro", city: "Campinas", requested: "2026-07-08", docs: 3 },
    { id: "v2", name: "Tiago Souza", category: "Encanador", city: "Curitiba", requested: "2026-07-07", docs: 2 },
    { id: "v3", name: "Rafael Gomes", category: "Técnico de informática", city: "Fortaleza", requested: "2026-07-05", docs: 3 },
    { id: "v4", name: "Sérgio Batista", category: "Marido de aluguel", city: "Porto Alegre", requested: "2026-07-03", docs: 1 },
  ],
  flaggedReviews: [
    { id: "fr1", author: "Anônimo", professional: "Bruno Carvalho", reason: "Linguagem ofensiva", date: "2026-07-08" },
    { id: "fr2", author: "Cliente X", professional: "Ricardo Alves", reason: "Suspeita de avaliação falsa", date: "2026-07-06" },
  ],
  reports: [
    { id: "rp1", type: "Perfil falso", target: "Perfil: instalador-express", status: "aberta", date: "2026-07-09" },
    { id: "rp2", type: "Cobrança indevida", target: "Profissional: p14", status: "em análise", date: "2026-07-07" },
    { id: "rp3", type: "Spam em propostas", target: "Profissional: p15", status: "aberta", date: "2026-07-05" },
  ],
  mockUsers: [
    { id: "u1", name: "Mariana Teixeira", email: "mariana.t@exemplo.com", role: "Cliente", status: "ativo", since: "2025-11-02" },
    { id: "u2", name: "Carlos Mendes", email: "carlos.m@exemplo.com", role: "Profissional", status: "ativo", since: "2025-08-14" },
    { id: "u3", name: "Eduardo Prado", email: "eduardo.p@exemplo.com", role: "Cliente", status: "ativo", since: "2026-01-20" },
    { id: "u4", name: "Rafael Gomes", email: "rafael.g@exemplo.com", role: "Profissional", status: "suspenso", since: "2026-02-05" },
    { id: "u5", name: "Renata Silveira", email: "renata.s@exemplo.com", role: "Cliente", status: "ativo", since: "2026-03-30" },
  ],
};
