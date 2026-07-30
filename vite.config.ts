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
        strategies: "injectManifest",
        // TanStack Start/Nitro collects public assets during its own closeBundle.
        // Generate the worker first or `/sw.js` is missing from the final server output.
        integration: { closeBundleOrder: "pre" },
        registerType: "autoUpdate",
        injectRegister: null,
        srcDir: "src",
        filename: "sw.ts",
        devOptions: { enabled: false },
        manifest: false, // manifest is served statically from public/manifest.webmanifest
        // TanStack Start/Nitro serves static production files from .output/public.
        // Writing to dist/client made /sw.js disappear on the VPS (HTTP 404).
        outDir: ".output/public",
        injectManifest: {
          globDirectory: ".output/public",
          globPatterns: ["favicon.ico", "icons/*.{png,svg,ico}"],
          globIgnores: ["**/_server/**", "**/_serverFn/**"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
  },
});
