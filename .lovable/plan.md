## Diagnóstico verificado agora (não é mais o Workbox)

Auditei o código e o domínio nesta sessão:

- `vite.config.ts` já usa **uma única estratégia**: `strategies: "injectManifest"`, `srcDir: "src"`, `filename: "sw.ts"`, `rollupFormat: "iife"`, `injectRegister: false`. Não existe `generateSW`, nem `public/sw.js`, nem `service-worker.js`, nem `push-handler.js`.
- Existe **um único registro** no frontend: `src/lib/pwa/serviceWorker.ts`. Nenhum `virtual:pwa-register` / `registerSW`.
- `scripts/verify-pwa-build.mjs` já bloqueia `define([`, `importScripts(`, chunks `workbox-*.js` e artefatos concorrentes.
- **O `sw.js` com `define(["./workbox-f0bb1bde"])` não está mais no ar.** Hoje:

```text
GET https://guiadfnamidia.com.br/sw.js
HTTP/2 404
content-type: text/html; charset=utf-8   (6001 bytes de HTML)
cf-cache-status: BYPASS, cache-control: max-age=14400
```

Já `/manifest.webmanifest`, `/icons/icon-192.png` e `/favicon.ico` retornam **200** com o content-type correto.

**Causa comprovada atual:** o navegador recebe **HTML** em `/sw.js` e falha ao avaliá-lo — daí "ServiceWorker script evaluation failed". Duas falhas concretas no pipeline:

1. `src/server.ts` tenta carregar o worker em runtime com `import("../dist/client/sw.js?raw")`. O sufixo `?raw` é uma transformação do Vite em tempo de build; no bundle Nitro publicado na VPS isso nunca resolve (e `dist/` sequer é enviado). O `catch` devolve `undefined`, a rota cai no SSR e o SSR responde 404 em HTML.
2. `scripts/verify-pwa-build.mjs` copia `dist/client/sw.js` para `.output/public/` **depois** que o Nitro já indexou os assets públicos, então o servidor node não serve esse arquivo.

## Correção

**1. Embutir o worker no bundle do servidor em tempo de build**
Adicionar em `vite.config.ts` um plugin Vite mínimo que expõe um módulo virtual (`virtual:app-service-worker`) resolvido apenas no build do servidor, lendo `dist/client/sw.js` do disco (o cliente é construído antes do servidor) e exportando o código como string. Em dev, exporta string vazia.

**2. `src/server.ts` passa a importar esse módulo virtual** em vez do `import("../dist/client/sw.js?raw")`, mantendo os headers já corretos (`text/javascript`, `no-store`, `service-worker-allowed: /`) e devolvendo **404 real** (não HTML) se o worker não estiver embutido.

**3. Reforçar o `verify-pwa-build.mjs`**
Além das checagens atuais, falhar o build se o bundle do servidor não contiver o conteúdo do worker (busca por um marcador do arquivo, ex. `NOTIFICATION_CLICK`) — assim é impossível publicar sem o `/sw.js` funcional. Manter também a cópia para `.output/public` como redundância.

**4. Deploy / Cloudflare**
Documentar em `DEPLOY.md`: após o deploy, "Purge Everything" (ou purga de `/sw.js`) na Cloudflare e uma Cache Rule de bypass para `/sw.js`, já que o CF hoje devolve `max-age=14400` na resposta 404.

## Fora de escopo desta correção

Não vou tocar em VAPID, RLS, tabelas de `push_subscriptions` ou funções de envio nesta etapa: o hook unificado (`usePushNotifications` como provider), o estado `isFullyEnabled`, o painel de diagnóstico, o "Reparar PWA" e o botão de teste já estão implementados e só podem ser validados de verdade **depois** que o worker registrar. Assim que você publicar com esta correção e o `/sw.js` retornar 200 em JavaScript, seguimos para a validação ponta a ponta (subscription → dispositivo no Supabase → envio de teste com o site aberto e fechado → clique abrindo `/notificacoes`) e corrijo o que aparecer com evidência.

## Verificação antes de encerrar

- `npm run build:vps` local, confirmando: `dist/client/sw.js` existe, é IIFE autossuficiente, sem `define(`/`importScripts(`/`workbox-*.js`; `.output/server/index.mjs` contém o worker embutido.
- Servir o build localmente e confirmar `GET /sw.js` → 200 + `text/javascript` + `no-store`.
- Após seu deploy, revalidar o domínio com `curl` (status, content-type, ausência de referência a Workbox externo) antes de declarar concluído.

## Detalhes técnicos

Arquivos alterados: `vite.config.ts` (plugin do módulo virtual), `src/server.ts` (import estático do worker + 404 real), `scripts/verify-pwa-build.mjs` (checagem do bundle do servidor), `DEPLOY.md` (purga de cache). Nenhuma migração, política RLS ou função backend é alterada.
