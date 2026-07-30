/* eslint-disable no-undef */
/**
 * Handlers de Web Push do Guia DF na Mídia.
 * Este arquivo é carregado via importScripts() pelo service worker gerado
 * (vite-plugin-pwa / Workbox). Ele NÃO faz cache — cuida apenas de push,
 * cliques em notificações e do controle de atualização.
 */

const DEFAULT_ICON = "/icons/icon-192.png";
const DEFAULT_BADGE = "/icons/badge-96.png";

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Guia DF na Mídia", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Guia DF na Mídia";
  const priority = payload.priority || "normal";
  const options = {
    body: payload.body || "",
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    image: payload.image || undefined,
    tag: payload.tag || payload.notificationId || "guia-df",
    renotify: priority === "high" || priority === "urgent",
    requireInteraction: priority === "urgent",
    timestamp: Date.now(),
    data: {
      notificationId: payload.notificationId || null,
      actionUrl: payload.actionUrl || "/",
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
    },
    actions: Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : [],
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);
      if (typeof payload.unreadCount === "number" && "setAppBadge" in self.navigator) {
        try {
          await self.navigator.setAppBadge(payload.unreadCount);
        } catch {
          /* badge não suportado */
        }
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = event.action && event.action.startsWith("/") ? event.action : data.actionUrl || "/";

  event.waitUntil(
    (async () => {
      const url = new URL(target, self.location.origin).href;
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const client of clientList) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        client.postMessage({ type: "NOTIFICATION_CLICK", url, notificationId: data.notificationId });
        if ("navigate" in client) {
          try {
            await client.navigate(url);
          } catch {
            /* navegação bloqueada — o postMessage acima cuida do roteamento */
          }
        }
        return;
      }

      await self.clients.openWindow(url);
    })(),
  );
});

self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};
  if (!data.notificationId) return;
  // Registro leve de descarte; falhas são ignoradas de propósito.
  event.waitUntil(
    fetch("/api/public/notification-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "dismissed", notificationId: data.notificationId }),
      keepalive: true,
    }).catch(() => {}),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
