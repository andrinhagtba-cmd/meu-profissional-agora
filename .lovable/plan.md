# Plano — Web Push funcionando de ponta a ponta

## Diagnóstico confirmado
- Em 30/07/2026 o domínio publicou um `sw.js` antigo em formato AMD que depende de `workbox-f0bb1bde.js` e de `push-handler.js`.
- `workbox-f0bb1bde.js` responde 404; por isso a avaliação do Service Worker falha antes da ativação.
- A resposta antiga de `/sw.js` estava em cache na Cloudflare por 4 horas (`cf-cache-status: HIT`, `cache-control: max-age=14400`).
- O código atual possui uma única fonte (`src/sw.ts`), um único registrador (`src/lib/pwa/serviceWorker.ts`) e banner/Central compartilham `subscribeCurrentDevice()`.

## Implementação

### 1. Corrigir a geração e publicação do worker
- Usar somente `injectManifest`, gerando um IIFE autossuficiente em `.output/public/sw.js` antes da coleta de assets do Nitro.
- Manter cache + Web Push no mesmo worker, sem `push-handler.js`, `define()`, `importScripts()` ou `workbox-*.js` externo.
- Servir `/sw.js` com `no-store` e `Service-Worker-Allowed: /`.
- Fazer o build falhar automaticamente se o artefato ou seus handlers estiverem ausentes ou se uma dependência externa reaparecer.
- Garantir que o worker não seja registrado em desenvolvimento, iframe ou preview da Lovable, preservando o funcionamento somente no app publicado.
- Remover qualquer configuração duplicada ou incompatível que possa gerar o worker no diretório errado.

### 2. Unificar registro e assinatura
- Fazer o banner e a Central usarem exatamente o mesmo registro fornecido pelo `PwaProvider`, evitando registros concorrentes ou estados diferentes.
- Separar explicitamente as etapas: suporte → permissão → worker ativo → `PushSubscription` criada → registro salvo no Supabase.
- Só retornar sucesso e fechar o banner após confirmar todas as etapas, incluindo uma leitura de verificação da assinatura local e do dispositivo persistido.
- Recuperar automaticamente registros antigos travados/redundantes, mas sem loops de unregister/register.

### 3. Corrigir estados e mensagens da interface
- Nunca mostrar sucesso apenas porque `Notification.permission === "granted"`.
- Exibir erro específico conforme a etapa que falhou: worker ausente, ativação expirada, assinatura recusada, chave VAPID inválida ou gravação bloqueada pelo banco.
- Sincronizar o banner e a Central imediatamente após ativar/desativar para não pedir novamente na mesma sessão.
- Impedir múltiplos cliques e garantir que o estado “Ativando…” sempre termine por sucesso, erro ou timeout.

### 4. Validar VAPID e persistência no Supabase
- Somente depois de comprovar worker `activated`, confirmar a criação da `PushSubscription`, persistência do dispositivo e envio de teste, sem alterar VAPID, RLS ou Edge Functions previamente.

### 5. Testes automatizados e de produção
- Adicionar testes focados na máquina de estados da ativação e nas falhas de cada etapa.
- Fazer build de produção e exigir que `.output/public/sw.js` seja autossuficiente e contenha os handlers `push` e `notificationclick`.
- Após publicar, validar no domínio real:
  - `/sw.js` retorna 200 e JavaScript;
  - worker chega a `activated` e controla a página;
  - permissão fica `granted`;
  - `pushManager.getSubscription()` retorna uma assinatura;
  - Supabase mostra um dispositivo `active`;
  - “Enviar teste” entrega a notificação;
  - ao recarregar e reabrir o PWA, banner e Central reconhecem o aparelho e não pedem nova ativação.

## Critério de conclusão
A correção só será considerada concluída quando o fluxo completo for comprovado no domínio publicado, do clique em “Ativar” até o recebimento de uma notificação de teste, incluindo reabertura do PWA sem novo pedido de permissão.