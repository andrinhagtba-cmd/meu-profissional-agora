# Deploy em VPS (Coolify / Nixpacks / Docker)

O projeto é **TanStack Start com SSR** — **não é site estático**. Ele precisa rodar um
processo Node. No Coolify, deixe **"Is it a static site?" desmarcado**.

## Build Pack: Nixpacks

O arquivo `nixpacks.toml` na raiz já define tudo:

- install: `bun install --frozen-lockfile`
- build: `bun run build:node` (usa `NITRO_PRESET=node-server`)
- start: `node .output/server/index.mjs`
- porta: `PORT` (padrão `3026`)

No Coolify, deixe **Install / Build / Start Command vazios** (o `nixpacks.toml` manda),
Base Directory `/` e Publish Directory `/`.

Se preferir preencher manualmente:

| Campo | Valor |
| --- | --- |
| Install Command | `bun install --frozen-lockfile` |
| Build Command | `bun run build:node` |
| Start Command | `node .output/server/index.mjs` |
| Port | `3026` |

## Variáveis de ambiente (obrigatórias)

Precisam existir **no build E no runtime** (as `VITE_*` são embutidas no bundle
durante o build, então marque-as como disponíveis em build time no Coolify):

```
VITE_SUPABASE_URL=https://ygsitqilwlwqefwcpmtm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=ygsitqilwlwqefwcpmtm
VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY=<chave do Google Maps>

SUPABASE_URL=https://ygsitqilwlwqefwcpmtm.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — NUNCA com prefixo VITE_>
NODE_ENV=production
PORT=3026
```

O `SUPABASE_SERVICE_ROLE_KEY` é usado pelas server functions administrativas
(`src/integrations/supabase/client.server.ts`). Sem ele, essas rotas falham.

## Depois de subir o domínio (`guiadfnamidia.com.br`)

1. Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://guiadfnamidia.com.br`
   - **Redirect URLs**: `https://guiadfnamidia.com.br/**`
2. Supabase → Storage: os buckets públicos (`avatars`, `portfolio`, `category-icons`,
   `admin-media`) continuam servindo pelo domínio do Supabase — nada a mudar.
3. Coolify → habilite HTTPS/Let's Encrypt e "Allow www & non-www".
4. No Cloudflare, crie uma **Cache Rule** com "Bypass cache" para `/sw.js` e,
   **a cada deploy**, execute *Caching → Configuration → Purge Everything* (ou
   purge por URL de `https://guiadfnamidia.com.br/sw.js`). Sem isso o CF pode
   continuar entregando a resposta anterior (já foi observado `max-age=14400`
   até em resposta 404). O aplicativo remove automaticamente registros antigos
   de `/gdf-push-sw.js` e `/service-worker.js` para evitar workers concorrentes.

## Como o `/sw.js` é servido

O worker é gerado pelo `vite-plugin-pwa` (`strategies: "injectManifest"`,
fonte única `src/sw.ts`, formato `iife`, sem chunks `workbox-*.js`) em
`dist/client/sw.js`. Em seguida o plugin `app-embed-service-worker`
(`vite.config.ts`) **embute esse arquivo dentro do bundle do servidor** via o
módulo virtual `virtual:app-service-worker`, e `src/server.ts` responde `/sw.js`
com esse conteúdo (`text/javascript`, `no-store`, `service-worker-allowed: /`).
Se o worker não estiver embutido, a rota devolve **404 real em texto** — nunca
o HTML da SPA. O `scripts/verify-pwa-build.mjs` falha o build quando o worker
não está embutido no bundle SSR ou quando volta a depender de Workbox externo.

## Verificação local do build de produção

```bash
NITRO_PRESET=node-server bun run build   # ou: bun run build:node
PORT=3026 node .output/server/index.mjs
```

Depois do deploy, esta verificação precisa mostrar `HTTP/2 200`,
`content-type: text/javascript`, `cache-control: no-store` e nenhum `define(`,
`importScripts(` ou `workbox-*.js`:

```bash
curl -i https://guiadfnamidia.com.br/sw.js
```


## Observações

- `bun run build` (sem o preset) mantém o alvo padrão da Lovable/Cloudflare — use
  `build:node` para a VPS.
- Não use `vite preview` em produção; ele não é um servidor de produção.
- Requisitos da máquina: Node 22+ e ~2 GB de RAM disponíveis durante o build.

## npm install falhando com ERESOLVE (valibot / @hookform/resolvers)

O resolvedor de peers do npm rejeita um peer opcional (`valibot`) que o Bun ignora.
O arquivo `.npmrc` na raiz já resolve isso com `legacy-peer-deps=true` — nada a fazer
no Coolify. Se preferir usar Bun, troque o Install Command por
`bun install --frozen-lockfile`.

Dica extra do log do Coolify: deixe `NODE_ENV=production` como **runtime only**
(desmarque "Available at Buildtime"), senão as devDependencies não são instaladas
e o build falha.
