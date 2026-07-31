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
const pwaBuildDirectory = "dist/client";
const serviceWorkerFilename = "sw.js";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: preset ? { preset } : true,
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
