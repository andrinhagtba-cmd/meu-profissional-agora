/// <reference types="google.maps" />
// Carregador único da Google Maps JavaScript API (Places New).
// Usa a chave de referrer segura injetada pelo conector.

const KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
  | string
  | undefined;
const CHANNEL = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
  | string
  | undefined;

let promise: Promise<typeof google> | null = null;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { __gmapsInit?: () => void; google?: any }
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google as typeof google);
  if (promise) return promise;
  if (!KEY) return Promise.reject(new Error("Google Maps browser key ausente"));

  promise = new Promise((resolve, reject) => {
    window.__gmapsInit = () => resolve(window.google as typeof google);
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: KEY,
      libraries: "places,marker",
      loading: "async",
      callback: "__gmapsInit",
      v: "weekly",
    });
    if (CHANNEL) params.set("channel", CHANNEL);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
    document.head.appendChild(s);
  });
  return promise;
}

export const hasGoogleMapsKey = Boolean(KEY);
