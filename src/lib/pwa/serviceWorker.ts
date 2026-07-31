/**
 * Registro guardado do service worker.
 * Nunca registra em dev, dentro de iframe ou em previews da Lovable —
 * nesses contextos qualquer SW antigo é removido.
 */

export type SwState = {
  supported: boolean;
  registered: boolean;
  updateAvailable: boolean;
  version: string | null;
  lastUpdatedAt: string | null;
};

// Caminho único do worker. O build, o servidor e o navegador precisam usar
// exatamente a mesma URL; na VPS este arquivo é servido sem cache pela origem.
const SW_PATH = "/sw.js";
const LEGACY_SW_PATHS = new Set(["/gdf-push-sw.js", "/service-worker.js"]);
let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

/* ------------------------------------------------------------------ */
/* Diagnóstico: registro de eventos legível no cliente                  */
/* ------------------------------------------------------------------ */

export type PwaLogLevel = "info" | "warn" | "error";
export type PwaLogEntry = { at: string; level: PwaLogLevel; message: string; detail?: string };

const MAX_LOGS = 60;
const logs: PwaLogEntry[] = [];
const logListeners = new Set<(entries: PwaLogEntry[]) => void>();

export function pwaLog(level: PwaLogLevel, message: string, detail?: unknown) {
  const entry: PwaLogEntry = {
    at: new Date().toISOString(),
    level,
    message,
    detail:
      detail === undefined
        ? undefined
        : detail instanceof Error
          ? `${detail.name}: ${detail.message}`
          : typeof detail === "string"
            ? detail
            : (() => {
                try {
                  return JSON.stringify(detail);
                } catch {
                  return String(detail);
                }
              })(),
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
  const line = `[PWA] ${message}${entry.detail ? ` — ${entry.detail}` : ""}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
  const snapshot = [...logs];
  logListeners.forEach((listener) => listener(snapshot));
}

export function getPwaLogs(): PwaLogEntry[] {
  return [...logs];
}

export function subscribePwaLogs(listener: (entries: PwaLogEntry[]) => void) {
  logListeners.add(listener);
  listener([...logs]);
  return () => {
    logListeners.delete(listener);
  };
}

export function clearPwaLogs() {
  logs.length = 0;
  logListeners.forEach((listener) => listener([]));
}


function isAppWorkerUrl(scriptUrl: string | undefined) {
  if (!scriptUrl) return false;
  try {
    const pathname = new URL(scriptUrl).pathname;
    return pathname === SW_PATH || LEGACY_SW_PATHS.has(pathname);
  } catch {
    return scriptUrl.includes(SW_PATH) || [...LEGACY_SW_PATHS].some((path) => scriptUrl.includes(path));
  }
}

function isStableAppWorkerUrl(scriptUrl: string | undefined) {
  if (!scriptUrl || typeof window === "undefined") return false;
  try {
    const url = new URL(scriptUrl, window.location.origin);
    return url.pathname === SW_PATH && url.search === "";
  } catch {
    return scriptUrl === SW_PATH;
  }
}

export function isPreviewContext(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  const inIframe = window.self !== window.top;
  return (
    inIframe ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev") ||
    new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off"
  );
}

export function canRegisterServiceWorker(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  return !isPreviewContext();
}

async function unregisterAppServiceWorkers() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => isAppWorkerUrl((r.active ?? r.waiting ?? r.installing)?.scriptURL))
      .map((r) => r.unregister()),
  );
}

function isPwaCache(name: string) {
  const normalized = name.toLowerCase();
  return normalized.startsWith("gdf-") || normalized.includes("workbox") || normalized.includes("precache") || normalized.includes("guia-df");
}

/** Remove somente workers, inscrições push e caches pertencentes ao PWA deste domínio. */
export async function repairPwaDevice(onSubscriptionFound?: (endpoint: string) => Promise<void>) {
  if (typeof window === "undefined") return;
  registrationPromise = null;
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const subscription = await registration.pushManager?.getSubscription().catch(() => null);
      if (subscription) {
        await onSubscriptionFound?.(subscription.endpoint).catch(() => undefined);
        await subscription.unsubscribe().catch(() => false);
      }
      await registration.unregister().catch(() => false);
    }
  }
  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.allSettled(names.filter(isPwaCache).map((name) => caches.delete(name)));
  }
}

function isAppRegistration(registration: ServiceWorkerRegistration) {
  const worker = registration.active ?? registration.waiting ?? registration.installing;
  if (!worker) return false;
  return isAppWorkerUrl(worker.scriptURL);
}

function waitForActivation(registration: ServiceWorkerRegistration, timeoutMs = 20_000) {
  if (registration.active) return Promise.resolve(registration);

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const worker = registration.installing ?? registration.waiting;
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("O serviço de notificações demorou para iniciar. Atualize o aplicativo e tente novamente."));
    }, timeoutMs);
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(registration);
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(error);
    };

    if (!worker) {
      navigator.serviceWorker.ready.then(finish).catch(() => {
        fail(new Error("O navegador não conseguiu concluir a ativação do serviço de notificações."));
      });
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "activated" || registration.active) finish();
      if (worker.state === "redundant") {
        fail(new Error("O serviço de notificações foi interrompido durante a ativação."));
      }
    });
  });
}

/**
 * Baixa o script do worker antes de registrar para transformar o genérico
 * "ServiceWorker script evaluation failed" em uma causa legível.
 */
async function preflightWorkerScript() {
  const url = new URL(SW_PATH, window.location.origin).toString();
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  } catch (e) {
    pwaLog("error", "Falha de rede ao baixar o script do serviço de notificações.", e);
    throw new Error(`Não foi possível baixar ${SW_PATH}. Verifique sua conexão e tente novamente.`);
  }

  const contentType = response.headers.get("content-type") ?? "desconhecido";
  pwaLog("info", `Verificação prévia de ${SW_PATH}`, `status=${response.status} content-type=${contentType}`);

  if (!response.ok) {
    throw new Error(`O arquivo ${SW_PATH} respondeu ${response.status}. O servidor não está publicando o service worker.`);
  }
  if (!/javascript|ecmascript/i.test(contentType)) {
    throw new Error(`O servidor entregou ${SW_PATH} como "${contentType}" em vez de JavaScript (provável fallback de HTML).`);
  }

  const source = await response.text();
  pwaLog("info", "Script do worker baixado.", `${source.length} bytes`);
  if (/^\s*<!doctype html/i.test(source) || /^\s*<html/i.test(source)) {
    throw new Error(`${SW_PATH} devolveu uma página HTML. O arquivo não existe na build publicada.`);
  }
  if (/\bdefine\s*\(\s*\[/.test(source)) {
    throw new Error(`${SW_PATH} está em formato AMD (define([...])) e depende de um chunk externo. Publique novamente a build atual e limpe o cache da CDN.`);
  }
  const importScripts = source.match(/importScripts\(([^)]*)\)/);
  if (importScripts) {
    throw new Error(`${SW_PATH} usa importScripts(${importScripts[1]}), que falha se o arquivo externo não existir.`);
  }
  return source.length;
}

/** Única porta de entrada para obter o worker usado pelo PWA e pelo Web Push. */
export async function ensureAppServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!canRegisterServiceWorker()) {
    const reason = isPreviewContext()
      ? "As notificações só podem ser ativadas no aplicativo publicado."
      : "Este navegador não permite registrar o serviço de notificações.";
    pwaLog("warn", "Registro do service worker ignorado neste contexto.", reason);
    throw new Error(reason);
  }

  if (!registrationPromise) {
    registrationPromise = (async () => {
      await preflightWorkerScript();

      const registrations = await navigator.serviceWorker.getRegistrations();
      pwaLog("info", `Registros existentes: ${registrations.length}`,
        registrations.map((r) => (r.active ?? r.waiting ?? r.installing)?.scriptURL ?? "sem worker").join(", "));

      let registration = registrations.find(isAppRegistration);
      const currentWorker = registration?.active ?? registration?.waiting ?? registration?.installing;
      if (registration && !isStableAppWorkerUrl(currentWorker?.scriptURL)) {
        pwaLog("warn", "Removendo registro antigo/incompatível.", currentWorker?.scriptURL);
        await registration.unregister();
        registration = undefined;
      }

      if (!registration) {
        try {
          registration = await navigator.serviceWorker.register(SW_PATH, {
            scope: "/",
            updateViaCache: "none",
          });
          pwaLog("info", "Service worker registrado.", SW_PATH);
        } catch (e) {
          pwaLog("error", "navigator.serviceWorker.register falhou.", e);
          throw new Error(
            `Não foi possível registrar ${SW_PATH}: ${(e as Error).message}. Use "Reparar aplicativo" e recarregue a página.`,
          );
        }
      } else {
        await registration.update().catch((e) => pwaLog("warn", "Falha ao checar atualização do worker.", e));
        pwaLog("info", "Reaproveitando registro existente.", currentWorker?.scriptURL);
      }

      const active = await waitForActivation(registration);
      pwaLog("info", "Service worker ativo.", `scope=${active.scope}`);
      return active;
    })().catch((error) => {
      registrationPromise = null;
      pwaLog("error", "Ativação do service worker falhou.", error);
      throw error;
    });
  }

  return registrationPromise;
}

/** Força a checagem de nova versão sob demanda (botão na interface). */
export async function updateAppServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await ensureAppServiceWorker();
  try {
    await registration.update();
    pwaLog("info", "Checagem de atualização concluída.", registration.waiting ? "nova versão aguardando" : "já está na versão mais recente");
  } catch (e) {
    pwaLog("warn", "Não foi possível checar atualização agora.", e);
  }
  return registration;
}


export type RegisterResult = {
  registration: ServiceWorkerRegistration | null;
  reason?: "unsupported" | "preview" | "dev";
};

export async function registerAppServiceWorker(
  onUpdateAvailable: (registration: ServiceWorkerRegistration) => void,
): Promise<RegisterResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { registration: null, reason: "unsupported" };
  }
  if (!canRegisterServiceWorker()) {
    await unregisterAppServiceWorkers();
    return { registration: null, reason: import.meta.env.PROD ? "preview" : "dev" };
  }

  const registration = await ensureAppServiceWorker();

  if (registration.waiting && navigator.serviceWorker.controller) {
    onUpdateAvailable(registration);
  }

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        onUpdateAvailable(registration);
      }
    });
  });

  // Checagem periódica de nova versão (a cada 30 min) sem recarregar nada.
  window.setInterval(() => {
    registration.update().catch(() => {});
  }, 30 * 60 * 1000);

  return { registration };
}

export function applyServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  const waiting = registration.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  waiting.postMessage({ type: "SKIP_WAITING" });
}
