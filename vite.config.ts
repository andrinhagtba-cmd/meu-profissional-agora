// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

// Self-hosting (VPS / Docker / Nixpacks): set NITRO_PRESET=node-server before `vite build`.
// Without it the build keeps the default Lovable/Cloudflare target.
const preset = process.env.NITRO_PRESET;
const pwaBuildDirectory = "dist/client";
const serviceWorkerFilename = "sw.js";

/**
 * Embute o service worker compilado (dist/client/sw.js) dentro do bundle do
 * servidor em tempo de build. O bundle cliente — e portanto o worker — é gerado
 * antes do bundle do servidor, então o arquivo já existe quando este módulo é
 * carregado. Isso garante que `/sw.js` sempre seja servido como JavaScript real
 * pelo SSR, sem depender do indexador de assets estáticos do Nitro nem de
 * leitura de disco em runtime na VPS.
 */
function embedServiceWorkerPlugin(): Plugin {
  const virtualId = "virtual:app-service-worker";
  const resolvedId = `\0${virtualId}`;

  return {
    name: "app-embed-service-worker",
    enforce: "post",
    resolveId(id) {
      return id === virtualId ? resolvedId : null;
    },
    load(id) {
      if (id !== resolvedId) return null;
      try {
        const source = readFileSync(
          resolve(process.cwd(), pwaBuildDirectory, serviceWorkerFilename),
          "utf8",
        );
        return `export default ${JSON.stringify(source)};`;
      } catch {
        // Dev (ou build do cliente): o worker ainda não existe em disco.
        return `export default "";`;
      }
    },
  };
}


export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: preset ? { preset } : true,
  vite: {
    plugins: [
      embedServiceWorkerPlugin(),
      VitePWA({

        strategies: "injectManifest",
        // Generate the worker before the server bundle is finalized.
        integration: { closeBundleOrder: "pre" },
        registerType: "autoUpdate",
        // Registration is centralized in src/lib/pwa/serviceWorker.ts.
        injectRegister: false,
        srcDir: "src",
        filename: serviceWorkerFilename,
        devOptions: { enabled: false },
        manifest: false, // manifest is served statically from public/manifest.webmanifest
        // O worker nasce no bundle cliente antes do Nitro. No preset Node, o
        // Nitro copia/incorpora exatamente esse arquivo em .output/public.
        outDir: pwaBuildDirectory,
        injectManifest: {
          // Um único IIFE autossuficiente: nenhum define(), importScripts(),
          // chunk workbox-*.js ou push-handler.js é necessário em produção.
          rollupFormat: "iife",
          globDirectory: pwaBuildDirectory,
          globPatterns: ["favicon.ico", "icons/*.{png,svg,ico}"],
          globIgnores: ["**/_server/**", "**/_serverFn/**"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
  },
});
