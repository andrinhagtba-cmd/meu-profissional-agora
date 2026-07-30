# Plano — Web Push funcionando de ponta a ponta

## Diagnóstico confirmado
- O domínio publicado responde **404 em `/sw.js`**, enquanto `/push-handler.js` e o manifest respondem 200. Sem o worker, o navegador pode conceder permissão, mas não consegue criar a assinatura Push.
- O banco tem atualmente **zero dispositivos ativos**; existe apenas um registro Android com status `revoked`. Por isso a Central volta a pedir ativação.
- A configuração já aponta o worker para `.output/public`, mas falta alinhar a execução do plugin PWA com a ordem de build do TanStack/Nitro; nesse stack, o worker pode não ser gerado antes de o Nitro coletar os arquivos públicos.
- A interface trata “permissão concedida” e “dispositivo realmente inscrito” como etapas próximas demais, produzindo a experiência contraditória mostrada na captura.

## Implementação

### 1. Corrigir a geração e publicação do worker
- Ajustar `vite.config.ts` para executar a geração do PWA antes da coleta de assets do Nitro, mantendo `sw.js` em `.output/public`.
- Manter um único worker para cache + Web Push, com `push-handler.js` importado pelo Workbox.
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
- Confirmar que a chave pública usada pelo navegador corresponde à chave pública configurada na função de envio.
- Validar a gravação em `push_subscriptions` com o usuário autenticado e as políticas RLS existentes.
- Confirmar que uma nova ativação gera um registro `active`, não `revoked`, com endpoint e chaves válidas.
- Testar a função `send-web-push` e melhorar o retorno de diagnóstico sem expor dados sensíveis.

### 5. Testes automatizados e de produção
- Adicionar testes focados na máquina de estados da ativação e nas falhas de cada etapa.
- Fazer build de produção e verificar antes da publicação que `.output/public/sw.js` existe e importa `push-handler.js`.
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