import { useEffect, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  latitude: number | null;
  longitude: number | null;
  radiusKm?: number | null;
  height?: number;
  /** Endereço em texto usado para localizar o mapa quando não há coordenadas salvas. */
  query?: string | null;
}

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeAddress(q: string) {
  if (geocodeCache.has(q)) return geocodeCache.get(q) ?? null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error("geocode failed");
    const json = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = json?.[0];
    const value = hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
    geocodeCache.set(q, value);
    return value;
  } catch {
    geocodeCache.set(q, null);
    return null;
  }
}

function buildOsmUrl(lat: number, lng: number) {
  // OpenStreetMap embed: free, no API key, works everywhere
  const delta = 0.02;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
}

export function LocationMap({ latitude, longitude, radiusKm, height = 220, query }: Props) {
  const [fallback, setFallback] = useState<{ lat: number; lng: number } | null>(null);
  const [searching, setSearching] = useState(false);

  const hasCoords = latitude != null && longitude != null;
  const q = (query ?? "").trim();

  useEffect(() => {
    if (hasCoords || q.length < 6) {
      setFallback(null);
      return;
    }
    let active = true;
    setSearching(true);
    const t = window.setTimeout(async () => {
      const hit = await geocodeAddress(q);
      if (!active) return;
      setFallback(hit);
      setSearching(false);
    }, 600);
    return () => {
      active = false;
      window.clearTimeout(t);
      setSearching(false);
    };
  }, [q, hasCoords]);

  const lat = hasCoords ? (latitude as number) : fallback?.lat ?? null;
  const lng = hasCoords ? (longitude as number) : fallback?.lng ?? null;

  const openInGoogleMaps = () => {
    if (lat == null || lng == null) return;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (lat == null || lng == null) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4 text-center text-xs text-muted-foreground"
        style={{ height }}
      >
        <MapPin size={18} aria-hidden="true" />
        {searching ? "Localizando endereço no mapa…" : "Selecione um endereço para visualizar no mapa."}
      </div>
    );
  }


  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/30"
        style={{ height }}
      >
        <iframe
          title="Mapa de localização"
          src={buildOsmUrl(latitude, longitude)}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {radiusKm && radiusKm > 0
            ? `Área de atendimento aproximada de ${radiusKm} km.`
            : "Localização aproximada do endereço cadastrado."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openInGoogleMaps}
          className="h-8 shrink-0 gap-1.5 rounded-full border-primary/30 text-xs font-medium text-primary hover:bg-primary/5"
        >
          <ExternalLink size={12} aria-hidden="true" />
          Abrir no Google Maps
        </Button>
      </div>
    </div>
  );
}
