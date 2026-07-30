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
  ...(preset ? { nitro: { preset } } : {}),
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "prompt",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        manifest: false, // manifest is served statically from public/manifest.webmanifest
        outDir: "dist/client",
        workbox: {
          // Custom push / notificationclick handlers live in public/push-handler.js
          importScripts: ["/push-handler.js"],
          globDirectory: "dist/client",
          globPatterns: ["**/*.{js,css,woff,woff2,svg,png,ico}"],
          globIgnores: ["**/_server/**", "**/_serverFn/**"],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          skipWaiting: false,
          clientsClaim: false,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              // HTML navigations: always try the network first so deploys land immediately.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" &&
                !url.pathname.startsWith("/~oauth") &&
                !url.pathname.startsWith("/api/") &&
                !url.pathname.startsWith("/_serverFn"),
              handler: "NetworkFirst",
              options: {
                cacheName: "gdf-html",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /\.(?:js|css|woff2?|png|svg|ico|webp|jpg|jpeg)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "gdf-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
  },
});
