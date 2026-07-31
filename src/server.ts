import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
// O worker compilado só existe depois do build (dist/client). Em dev o arquivo
// não existe, então a importação precisa ser preguiçosa e tolerante a falhas.
let compiledServiceWorkerPromise: Promise<string | undefined> | undefined;

async function loadCompiledServiceWorker(): Promise<string | undefined> {
  if (!compiledServiceWorkerPromise) {
    compiledServiceWorkerPromise = import(
      /* @vite-ignore */ "../dist/client/sw.js?raw"
    )
      .then((m) => (m.default ?? m) as string)
      .catch(() => undefined);
  }
  return compiledServiceWorkerPromise;
}

const SERVICE_WORKER_PATH = "/sw.js";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function serviceWorkerResponse(): Promise<Response | undefined> {
  const compiledServiceWorker = await loadCompiledServiceWorker();
  if (!compiledServiceWorker) return undefined;
  const headers = new Headers();
  // Service Workers devem sempre ser revalidados. Isso evita que a CDN mantenha
  // uma geração antiga depois do deploy e garante o controle do scope raiz.
  headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  headers.set("service-worker-allowed", "/");
  headers.set("content-type", "text/javascript; charset=utf-8");
  return new Response(compiledServiceWorker, { status: 200, headers });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      if (new URL(request.url).pathname === SERVICE_WORKER_PATH) {
        const swResponse = await serviceWorkerResponse();
        if (swResponse) return swResponse;
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
