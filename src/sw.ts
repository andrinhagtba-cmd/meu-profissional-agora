/// <reference lib="webworker" />

import { clientsClaim, setCacheNameDetails } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

setCacheNameDetails({ prefix: "gdf", suffix: "v1" });
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("install", () => {
  void self.skipWaiting();
});

clientsClaim();

registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" &&
    !url.pathname.startsWith("/~oauth") &&
    !url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/_serverFn"),
  new NetworkFirst({
    cacheName: "gdf-html-v1",
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 })],
  }),
);

registerRoute(
  ({ request, sameOrigin }) =>
    sameOrigin && ["script", "style", "font", "image"].includes(request.destination),
  new CacheFirst({
    cacheName: "gdf-assets-v1",
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

self.addEventListener("push", (event) => {
  let payload: Record<string, unknown> = {};
  try {
    payload = event.data ? (event.data.json() as Record<string, unknown>) : {};
  } catch {
    payload = {
      title: "Guia DF na Mídia",
      body: event.data ? event.data.text() : "Você recebeu uma nova notificação.",
    };
  }

  const title = typeof payload.title === "string" ? payload.title : "Guia DF na Mídia";
  const priority = typeof payload.priority === "string" ? payload.priority : "normal";
  const notificationId = typeof payload.notificationId === "string" ? payload.notificationId : null;
  const actionUrl = typeof payload.actionUrl === "string" ? payload.actionUrl : "/notificacoes";
  const options: NotificationOptions & { image?: string; renotify?: boolean } = {
    body:
      typeof payload.body === "string"
        ? payload.body
        : typeof payload.message === "string"
          ? payload.message
          : "Você recebeu uma nova notificação.",
    icon: typeof payload.icon === "string" ? payload.icon : "/icons/icon-192.png",
    badge: typeof payload.badge === "string" ? payload.badge : "/icons/badge-96.png",
    image: typeof payload.image === "string" ? payload.image : undefined,
    tag:
      typeof payload.tag === "string"
        ? payload.tag
        : notificationId ?? "guia-df-notification",
    renotify: Boolean(payload.renotify),
    requireInteraction: priority === "urgent",
    data: { notificationId, actionUrl },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = (event.notification.data ?? {}) as { actionUrl?: unknown; notificationId?: unknown };
  const actionUrl = typeof data.actionUrl === "string" ? data.actionUrl : "/notificacoes";
  const targetUrl = new URL(actionUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        client.postMessage({ type: "NOTIFICATION_CLICK", url: targetUrl });
        if ("navigate" in client) await client.navigate(targetUrl);
        return;
      }
      await self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});