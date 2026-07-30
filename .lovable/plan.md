## Fase 2 — Infraestrutura de Web Push (VAPID)

Objetivo: toda notificação criada no banco vira push real nos dispositivos registrados, com controle de duplicidade, múltiplos dispositivos por usuário, preferências e log de falhas.

### Situação atual verificada
- `public.notifications` tem apenas: `id, user_id, title, message, type, link, read, created_at`. Não há `read_at`, prioridade, entidade relacionada nem chave de deduplicação.
- Bug confirmado: a função `mark_pro_quote_viewed` tenta atualizar `notifications.read_at`, coluna que não existe — hoje essa chamada falha. Será corrigida nesta fase.
- Não existe nenhuma tabela de dispositivos/subscriptions, nenhuma Edge Function no projeto e nenhum segredo VAPID configurado.
- O service worker já está pronto e escuta `push`, `notificationclick` e `notificationclose` (`public/push-handler.js`), incluindo badge do app e deep link. Falta só o backend que envia.

### 1. Banco de dados (uma migração)
- `push_subscriptions`: usuário, endpoint (único), chaves `p256dh`/`auth`, rótulo do dispositivo, plataforma, navegador, user agent, status (`active`/`expired`/`revoked`), último uso, contagem de falhas. RLS: cada usuário gerencia os próprios dispositivos; admin lê todos.
- `notification_preferences`: por usuário, liga/desliga push e in-app por grupo de evento (mensagens, orçamentos, propostas, avaliações, assinatura, moderação, sistema) + janela de silêncio opcional.
- `notification_deliveries`: log por dispositivo com status (`queued`/`sent`/`failed`/`expired`), código HTTP, erro e data — base de rastreamento de falhas.
- Ampliar `notifications`: `read_at`, `priority`, `entity_type`, `entity_id`, `dedupe_key` (único por usuário, evita disparo duplicado) e `push_status`. Backfill de `read_at` a partir de `read`.
- Corrigir `mark_pro_quote_viewed` para usar as colunas corretas.
- Trigger `AFTER INSERT` em `notifications` que chama a Edge Function de envio via `pg_net`, respeitando preferências do usuário.

### 2. Segredos e Edge Function
- Gerar par VAPID e salvar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. A chave pública também vai para `.env` como `VITE_VAPID_PUBLIC_KEY` (é pública por natureza).
- Edge Function `send-web-push`: recebe `notificationId` (ou `userId` + payload), carrega dispositivos ativos, monta o payload que o `push-handler.js` já entende (título, corpo, ícone, `actionUrl`, `unreadCount`, prioridade), envia em paralelo, grava `notification_deliveries` e marca como `expired` as subscriptions que retornarem 404/410.

### 3. Registro de dispositivos no app
- `src/lib/push/pushClient.ts`: converte a chave VAPID, faz `subscribe`, salva/atualiza a subscription no banco (upsert por endpoint) e permite remover o dispositivo.
- Hook `use-push-notifications`: estado de suporte, permissão (`default`/`granted`/`denied`), dispositivo atual registrado, ações de ativar e desativar, com tratamento de iOS (exige app instalado) e permissão negada.
- Sincronizar automaticamente ao logar e ao trocar de usuário; remover assinatura ao sair.

### 4. Interface
- Card "Notificações no dispositivo" reaproveitável, usado em: painel do cliente/profissional (`/painel/notificacoes`) e no admin (aba Aplicativo em Configurações). Mostra permissão, botão de ativar, lista de dispositivos registrados com apelido/última utilização e opção de revogar.
- Bloco de preferências por tipo de evento gravando em `notification_preferences`.
- Painel administrativo de diagnóstico ganha: total de dispositivos ativos, últimos envios e falhas recentes (a partir de `notification_deliveries`), com botão "Enviar push de teste para mim".

### 5. Verificação
- Enviar push de teste para o próprio usuário e conferir o registro em `notification_deliveries`.
- Confirmar que uma nova mensagem/proposta gera notificação no banco e push no dispositivo, sem duplicidade.

### Observações técnicas
- Envio fica em Supabase Edge Function (escolha já confirmada), acionada por trigger `pg_net` — funciona também para rotinas `pg_cron` de vencimento de assinatura.
- Push só funciona em HTTPS/produção; no preview do Lovable o service worker permanece desativado, então o teste final é feito na URL publicada ou na VPS.
- Central de notificações completa (sino global, badge, histórico com filtros e deep links) fica para a Fase 3, conforme o plano das 5 fases.
