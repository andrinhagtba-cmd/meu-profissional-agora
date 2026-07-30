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

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    ...(preset ? { preset } : {}),
    routeRules: {
      // A Cloudflare estava mantendo uma geração quebrada do worker por 4 horas.
      // O navegador já usa updateViaCache:"none", e estes headers impedem que
      // proxies/CDNs reutilizem um sw.js antigo entre deploys.
      "/sw.js": {
        headers: {
          "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "service-worker-allowed": "/",
          "content-type": "text/javascript; charset=utf-8",
        },
      },
    },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "injectManifest",
        // TanStack Start/Nitro collects public assets during its own closeBundle.
        // Generate the worker first or `/sw.js` is missing from the final server output.
        integration: { closeBundleOrder: "pre" },
        registerType: "autoUpdate",
        // Registration is centralized in src/lib/pwa/serviceWorker.ts.
        injectRegister: false,
        srcDir: "src",
        filename: "sw.ts",
        devOptions: { enabled: false },
        manifest: false, // manifest is served statically from public/manifest.webmanifest
        // TanStack Start/Nitro serves static production files from .output/public.
        // Writing to dist/client made /sw.js disappear on the VPS (HTTP 404).
        outDir: ".output/public",
        injectManifest: {
          // Um único IIFE autossuficiente: nenhum define(), importScripts(),
          // chunk workbox-*.js ou push-handler.js é necessário em produção.
          rollupFormat: "iife",
          globDirectory: ".output/public",
          globPatterns: ["favicon.ico", "icons/*.{png,svg,ico}"],
          globIgnores: ["**/_server/**", "**/_serverFn/**"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
  },
});
