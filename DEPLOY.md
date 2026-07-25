# Deploy em VPS (Coolify / Nixpacks / Docker)

O projeto é **TanStack Start com SSR** — **não é site estático**. Ele precisa rodar um
processo Node. No Coolify, deixe **"Is it a static site?" desmarcado**.

## Build Pack: Nixpacks

O arquivo `nixpacks.toml` na raiz já define tudo:

- install: `bun install --frozen-lockfile`
- build: `bun run build:node` (usa `NITRO_PRESET=node-server`)
- start: `node .output/server/index.mjs`
- porta: `PORT` (padrão `3000`)

No Coolify, deixe **Install / Build / Start Command vazios** (o `nixpacks.toml` manda),
Base Directory `/` e Publish Directory `/`.

Se preferir preencher manualmente:

| Campo | Valor |
| --- | --- |
| Install Command | `bun install --frozen-lockfile` |
| Build Command | `bun run build:node` |
| Start Command | `node .output/server/index.mjs` |
| Port | `3000` |

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
PORT=3000
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

## Verificação local do build de produção

```bash
NITRO_PRESET=node-server bun run build   # ou: bun run build:node
PORT=3000 node .output/server/index.mjs
```

## Observações

- `bun run build` (sem o preset) mantém o alvo padrão da Lovable/Cloudflare — use
  `build:node` para a VPS.
- Não use `vite preview` em produção; ele não é um servidor de produção.
- Requisitos da máquina: Node 22+ e ~2 GB de RAM disponíveis durante o build.
