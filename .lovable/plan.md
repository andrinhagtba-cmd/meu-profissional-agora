# Finalização do Sistema — Etapa Premium Final

Auditoria concluída. Ainda restam **4 páginas stub** (`AdminComingSoon`), **configurações do sistema faltando** (logo, brand, dados fiscais) e a **página pública de planos** sem rota. Vou entregar em 3 blocos focados, cada um seguindo o padrão premium já estabelecido (hero + KPIs + cards operacionais).

## Bloco 1 — Configurações do Sistema (`/admin/configuracoes`)

Página com abas premium para o admin gerenciar identidade, marca e o próprio perfil.

- **Aba Marca**: upload de logo (claro + escuro), favicon, cor primária/secundária, nome comercial, tagline. Persiste em `site_pages` (nova entrada `site_settings` singleton) + `media_assets` (uploader real via `adminMediaService`).
- **Aba Empresa**: razão social, CNPJ, endereço, contatos oficiais, redes sociais.
- **Aba Meu Perfil**: edição do perfil do admin logado (nome, avatar, telefone, e-mail exibido) — usa `profiles` + `media_assets`. Troca de senha via `supabase.auth.updateUser`.
- **Aba Preferências**: idioma padrão, timezone, moeda, formato de data.

## Bloco 2 — Módulos Operacionais restantes

- **`/admin/integracoes`** — cards por integração (Supabase, Resend, WhatsApp, Google Analytics, Meta Pixel) com status de conexão, botão "Configurar" e switches de ativação. Guarda em `site_pages` como JSON de configuração.
- **`/admin/templates`** — editor de templates de e-mail/notificação (boas-vindas, nova proposta, review, reset senha). Lista + editor lateral com variáveis dinâmicas ({{nome}}, {{link}}), preview e teste de envio.
- **`/admin/regioes`** — gestão de UFs e cidades atendidas. Grid de estados com contador de profissionais ativos, drawer para editar cidades cobertas. Usa `service_areas` + agregação de `professional_profiles`.

## Bloco 3 — Rota pública `/planos`

Landing premium de assinatura para profissionais.

- Hero editorial "Escolha o plano ideal para crescer" com toggle mensal/anual.
- Grid de 3 cards de plano (Grátis / Pro / Elite) puxando dados reais da tabela `plans`.
- Comparativo de features em tabela.
- FAQ com dados reais de `admin_faqs` (categoria "planos").
- CTAs conectados a `/auth?role=profissional&plano=<slug>`.
- SEO completo (title, description, og:title, og:description).
- Link no header público e no footer.

## Padrões técnicos

- Todos os novos módulos admin seguem: hero com stats + MetricCards + cards operacionais em `rounded-2xl` + design tokens semânticos.
- Upload de mídia usa `src/services/adminMediaService.ts` (já existente).
- Novas queries agregadas via `src/services/adminService.ts`.
- Nenhuma alteração no frontend público existente além da nova rota `/planos` e link no menu.

## Ordem de execução

1. Migração leve: tabela `system_settings` (singleton) para guardar branding + preferências.
2. Bloco 1 (Configurações + logo).
3. Bloco 3 (Planos público — desbloqueia CTA de assinatura).
4. Bloco 2 (Integrações → Templates → Regiões).

Cada bloco é entregue e validado individualmente antes do próximo. Posso começar?