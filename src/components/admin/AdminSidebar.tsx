import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Briefcase, ShieldCheck, Tag, Wrench, MapPin,
  ClipboardList, MessageSquare, Zap, Star, Flag, CreditCard, Sparkles,
  Ticket, Receipt, Image as ImageIcon, LayoutTemplate, Home, FileText,
  BookOpen, HelpCircle, Quote, Bell, Mail, Send, Settings, Plug, KeyRound,
  ScrollText, Lock, Activity, Building2, Award, BarChart3,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useBrand } from "@/hooks/use-brand";


type Item = { to: string; label: string; icon: React.ComponentType<{ size?: number }> };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: "Visão geral",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/metricas", label: "Métricas", icon: Activity },
      { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/admin/atividade", label: "Atividade recente", icon: Bell },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { to: "/admin/usuarios", label: "Usuários", icon: Users },
      { to: "/admin/clientes", label: "Clientes", icon: Users },
      { to: "/admin/profissionais", label: "Profissionais", icon: Briefcase },
      { to: "/admin/empresas", label: "Empresas", icon: Building2 },
      { to: "/admin/administradores", label: "Administradores", icon: ShieldCheck },
      { to: "/admin/verificacoes", label: "Verificações", icon: Award },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { to: "/admin/categorias", label: "Categorias", icon: Tag },
      { to: "/admin/servicos", label: "Serviços", icon: Wrench },
      { to: "/admin/regioes", label: "Regiões", icon: MapPin },
      { to: "/admin/solicitacoes", label: "Solicitações", icon: ClipboardList },
      { to: "/admin/propostas", label: "Propostas", icon: MessageSquare },
      { to: "/admin/leads", label: "Leads", icon: Zap },
      { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
      { to: "/admin/denuncias", label: "Denúncias", icon: Flag },
    ],
  },
  {
    label: "Monetização",
    items: [
      { to: "/admin/planos", label: "Planos", icon: CreditCard },
      { to: "/admin/assinaturas", label: "Assinaturas", icon: Receipt },
      { to: "/admin/beneficios", label: "Benefícios", icon: Sparkles },
      { to: "/admin/destaques", label: "Destaques", icon: Sparkles },
      { to: "/admin/cupons", label: "Cupons", icon: Ticket },
      { to: "/admin/faturamento", label: "Faturamento", icon: Receipt },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/admin/midias", label: "Mídias", icon: ImageIcon },
      { to: "/admin/banners", label: "Banners", icon: LayoutTemplate },
      { to: "/admin/homepage", label: "Homepage", icon: Home },
      { to: "/admin/blog", label: "Blog", icon: BookOpen },
      { to: "/admin/paginas", label: "Páginas", icon: FileText },
      { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { to: "/admin/depoimentos", label: "Depoimentos", icon: Quote },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
      { to: "/admin/templates", label: "Templates", icon: Mail },
      { to: "/admin/contatos", label: "Contatos", icon: Send },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
      { to: "/admin/integracoes", label: "Integrações", icon: Plug },
      { to: "/admin/permissoes", label: "Permissões", icon: KeyRound },
      { to: "/admin/logs", label: "Logs", icon: ScrollText },
      { to: "/admin/seguranca", label: "Segurança", icon: Lock },
      { to: "/admin/status", label: "Status", icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname === to || pathname.startsWith(to + "/");
  const { data: brand, isLoading } = useBrand();
  const brandName = brand?.brand_name ?? "ProConecta";
  const logoUrl = brand?.logo_light_url ?? null;
  const initial = brandName.trim().charAt(0).toUpperCase() || "P";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/70 bg-sidebar">
        <Link to="/admin" className="flex items-center gap-3 px-1.5 py-2">
          {isLoading ? (
            <div className={collapsed ? "h-9 w-9" : "h-12 w-[140px]"}>
              <div className="h-full w-full animate-pulse rounded-xl bg-sidebar-accent" />
            </div>
          ) : logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              className={collapsed ? "h-9 w-9 object-contain" : "h-12 w-auto max-w-[220px] object-contain"}
            />
          ) : (
            <>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.42_0.24_262)] text-primary-foreground font-black shadow-[0_6px_18px_-6px_oklch(0.51_0.245_262/55%)]">
                {initial}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate font-display text-[15px] font-extrabold tracking-tight text-sidebar-foreground">
                    {brandName}
                  </div>
                  <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/70">
                    Console admin
                  </div>
                </div>
              )}
            </>
          )}
        </Link>

      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                        <Link to={item.to} className="flex items-center gap-2.5">
                          <Icon size={17} />
                          {!collapsed && <span className="truncate text-[13px] font-medium">{item.label}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
