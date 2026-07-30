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

const SW_URL = "/sw.js";
let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

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
      .filter((r) => (r.active?.scriptURL ?? r.waiting?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

function isAppRegistration(registration: ServiceWorkerRegistration) {
  const worker = registration.active ?? registration.waiting ?? registration.installing;
  if (!worker) return false;
  try {
    return new URL(worker.scriptURL).pathname === SW_URL;
  } catch {
    return worker.scriptURL.endsWith(SW_URL);
  }
}

function waitForActivation(registration: ServiceWorkerRegistration, timeoutMs = 20_000) {
  if (registration.active) return Promise.resolve(registration);

  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const worker = registration.installing ?? registration.waiting;
    const timer = window.setTimeout(() => {
      reject(new Error("O serviço de notificações demorou para iniciar. Atualize o aplicativo e tente novamente."));
    }, timeoutMs);

    const finish = () => {
      window.clearTimeout(timer);
      resolve(registration);
    };

    if (!worker) {
      navigator.serviceWorker.ready.then(finish).catch(reject);
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "activated" || registration.active) finish();
      if (worker.state === "redundant") {
        window.clearTimeout(timer);
        reject(new Error("O serviço de notificações foi interrompido durante a ativação."));
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
      if (!registration) {
        registration = await navigator.serviceWorker.register(SW_URL, {
          scope: "/",
          updateViaCache: "none",
        });
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
