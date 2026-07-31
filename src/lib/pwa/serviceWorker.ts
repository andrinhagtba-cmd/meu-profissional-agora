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

const SW_PATH = "/sw.js";
let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

function isAppWorkerUrl(scriptUrl: string | undefined) {
  if (!scriptUrl) return false;
  try {
    return new URL(scriptUrl).pathname === SW_PATH;
  } catch {
    return scriptUrl.includes(SW_PATH);
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

/** Única porta de entrada para obter o worker usado pelo PWA e pelo Web Push. */
export async function ensureAppServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!canRegisterServiceWorker()) {
    throw new Error(
      isPreviewContext()
        ? "As notificações só podem ser ativadas no aplicativo publicado."
        : "Este navegador não permite registrar o serviço de notificações.",
    );
  }

  if (!registrationPromise) {
    registrationPromise = (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      let registration = registrations.find(isAppRegistration);
      const currentWorker = registration?.active ?? registration?.waiting ?? registration?.installing;
      if (registration && !isStableAppWorkerUrl(currentWorker?.scriptURL)) {
        await registration.unregister();
        registration = undefined;
      }
      if (!registration) {
        registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
          updateViaCache: "none",
        });
      } else {
        await registration.update();
      }
      return waitForActivation(registration);
    })().catch((error) => {
      registrationPromise = null;
      throw error;
    });
  }

  return registrationPromise;
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
