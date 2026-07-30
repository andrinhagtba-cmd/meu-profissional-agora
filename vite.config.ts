// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Self-hosting (VPS / Docker / Nixpacks): set NITRO_PRESET=node-server before `vite build`.
// Without it the build keeps the default Lovable/Cloudflare target.
const preset = process.env.NITRO_PRESET;
const nitroConfig = {
  ...(preset ? { preset } : {}),
  routeRules: {
    "/sw.js": {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "service-worker-allowed": "/",
        "content-type": "text/javascript; charset=utf-8",
      },
    },
  },
} as unknown as { preset?: string };

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: nitroConfig,
  vite: {
    plugins: [
      VitePWA({
        strategies: "injectManifest",
        // Generate the worker before the server bundle is finalized.
        integration: { closeBundleOrder: "pre" },
        registerType: "autoUpdate",
        // Registration is centralized in src/lib/pwa/serviceWorker.ts.
        injectRegister: false,
        srcDir: "src",
        filename: "sw.ts",
        devOptions: { enabled: false },
        manifest: false, // manifest is served statically from public/manifest.webmanifest
        // O pacote final deste preset é dist/client + dist/server. Escrever em
        // .output/public cria uma saída paralela incompleta e apaga assets.
        outDir: "dist/client",
        injectManifest: {
          // Um único IIFE autossuficiente: nenhum define(), importScripts(),
          // chunk workbox-*.js ou push-handler.js é necessário em produção.
          rollupFormat: "iife",
          globDirectory: "dist/client",
          globPatterns: ["favicon.ico", "icons/*.{png,svg,ico}"],
          globIgnores: ["**/_server/**", "**/_serverFn/**"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
  },
});
