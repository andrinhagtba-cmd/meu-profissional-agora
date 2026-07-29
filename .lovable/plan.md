
# Guia DF na Mídia — Evolução em 6 fases

## Diagnóstico atual

- **Endereço**: já existem no banco `postal_code, street, address_number, address_complement, neighborhood, city, state, address_reference, latitude, longitude, formatted_address`. O campo **Complemento** existe no banco mas **não aparece** na página pública nem em todos os formulários (falta no editor admin e na exibição pública).
- **Horário de funcionamento**: **não existe** (nenhuma coluna/tabela).
- **Assinaturas**: tabela `subscriptions` tem apenas `status, started_at, expires_at, external_reference`. Faltam contratação, entrega/ativação, próxima renovação, valor, forma de pagamento, observações, e os status ampliados.
- **Destaques**: tabela `highlights` tem `section, position, starts_at, ends_at, is_active, notes`. Falta prioridade, métricas (impressões/cliques/contatos) e **rotação** — hoje a home ordena sempre igual (`is_featured` + rating).
- **Depoimentos**: tabela `testimonials` sem região administrativa, serviço, profissional vinculado nem status pendente/aprovado (só `is_published`).
- **Pedidos recentes**: componente `RecentRequests.tsx` ainda usa mock (`src/data/quoteRequests.ts`), não o banco.
- **Uploads**: já funcionam via Supabase Storage (`media_assets` + buckets privados assinados). Falta compressão/WebP, progresso, reordenação e paridade admin/profissional em todos os tipos de imagem.

## Fase 1 — Endereço completo + Complemento

- Migração: garantir `address_complement` e `address_reference` em `quote_requests` (cliente) — profissionais já têm.
- Formulários: wizard do profissional, cadastro admin (`admin.profissionais.novo`), editor admin (`AdminProProfileEditor`), perfil do painel, pedido de orçamento.
- Normalização: função única `formatProAddress()` monta CEP → Logradouro, Nº, Complemento — Bairro — RA/DF, respeitando `public_address_visibility`.
- Validação DF: estado fixo `DF` + RA validada pela lista oficial (já existe `dfRegions.ts` e trigger SQL); bloquear salvamento incompleto sem apagar dados legados.
- Página pública: exibir endereço formatado + complemento + ponto de referência, mantendo o mapa atual.

## Fase 2 — Horário de funcionamento

- Migração: tabela `professional_business_hours` (professional_id, weekday 0-6, is_closed, is_24h, open_time, close_time, break_start, break_end) + `holiday_note`, com RLS (dono edita, admin tudo, leitura pública dos perfis publicados).
- Editor reutilizável `BusinessHoursEditor` (profissional + admin): fechado, 24h, intervalo, copiar para os demais dias.
- Página pública: badge **Aberto agora** (verde) / **Fechado agora** (vermelho) + próximo horário de abertura + lista da semana, tudo calculado em `America/Sao_Paulo`.

## Fase 3 — Assinaturas

- Migração aditiva em `subscriptions`: `contracted_at, delivered_at, next_renewal_at, amount, payment_method, admin_notes` + novos valores de status (`pending, configuring, awaiting_approval, active, expiring, expired, suspended, cancelled`) preservando dados atuais.
- Admin `/admin/assinaturas`: cards de alerta (vence em 30/15/7 dias, vencidas, perfis não entregues), filtros por status, plano, vencimento, entrega, profissional, RA; edição completa das datas.

## Fase 4 — Destaques rotativos + Gestão de Destaques

- Migração: `highlights` ganha `priority, impressions, clicks, contacts, group_key`; tabela `highlight_events` para métricas; função SQL `list_rotating_highlights(section, limit)` que filtra ativos, dentro do período, perfis publicados/aprovados, assinatura válida e com imagem, ordenando por prioridade + menos impressões + aleatoriedade com semente por hora.
- Home e seções passam a consumir a rotação (sem duplicar o mesmo profissional).
- `/admin/destaques` vira "Gestão de Destaques": período, prioridade, páginas de exibição, prévia do card, impressões/cliques/contatos, alerta de vencidos e de perfis sem imagem.

## Fase 5 — Uploads de imagem (profissional + admin)

- Componente único `ImageUploader` com prévia, progresso, compressão + conversão WebP no cliente, limite de tamanho, validação de formato, mensagens em português.
- Galeria com reordenação (drag), definir imagem principal e confirmação de exclusão.
- Tipos: logo, avatar, capa, portfólio, serviços, estabelecimento, antes/depois.
- Revisão das políticas RLS de `storage.objects` e `media_assets`: dono só o próprio, admin total, leitura pública das mídias publicadas.

## Fase 6 — Pedidos recentes + Depoimentos do DF

- `RecentRequests` passa a ler `list_public_quote_requests` (dados reais, sem nome/telefone/e-mail/endereço do cliente), com serviço, RA, data, prazo, resumo, nº de propostas, status e selo "novo".
- CTA: visitante → cadastro/planos; profissional autenticado → oportunidades filtradas por categoria, serviços, região e assinatura ativa.
- Migração `testimonials`: `region, service_name, rating, professional_id, status (pending/approved/rejected), is_featured, display_pages`.
- Seção pública renomeada para "Quem contratou, recomenda" exibindo só aprovados; admin com criar/editar/aprovar/reprovar/ordenar/destacar/excluir/vincular profissional.

## Detalhes técnicos

- Todas as migrações são **aditivas** (`ADD COLUMN IF NOT EXISTS`, novas tabelas), com FKs, índices, `created_at`/`updated_at`, trigger `tg_set_updated_at`, GRANTs e RLS. Nenhum dado existente é apagado.
- Camada de dados nova em `src/services/` (businessHoursService, highlightService, subscriptionService), reaproveitando `supabasePublic` para leitura pública e RLS de admin já existente.
- Design mantido: tokens atuais, cards `rounded-2xl/3xl`, pills azuis, acento laranja, skeletons e estados vazios no padrão premium do admin.

## Execução

Sugiro entregar **uma fase por vez**, cada uma testada e validada por você antes da seguinte — começando pela Fase 1 (endereço/complemento) e Fase 2 (horários), que são as de maior impacto na página pública.
