import { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { loadGoogleMaps, hasGoogleMapsKey } from "@/lib/googleMapsLoader";
import { Button } from "@/components/ui/button";

interface Props {
  latitude: number | null;
  longitude: number | null;
  radiusKm?: number | null;
  height?: number;
}

export function LocationMap({ latitude, longitude, radiusKm, height = 220 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circleRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const openInGoogleMaps = () => {
    if (latitude == null || longitude == null) return;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!hasGoogleMapsKey || latitude == null || longitude == null || !ref.current) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setStatus("error");
    }, 8000);

    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !ref.current) return;
        window.clearTimeout(timeout);
        const pos = { lat: latitude, lng: longitude };
        if (!mapRef.current) {
          mapRef.current = new g.maps.Map(ref.current, {
            center: pos,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "cooperative",
          });
        } else {
          mapRef.current.setCenter(pos);
        }
        if (markerRef.current) markerRef.current.setMap(null);
        markerRef.current = new g.maps.Marker({ position: pos, map: mapRef.current });
        if (circleRef.current) circleRef.current.setMap(null);
        if (radiusKm && radiusKm > 0) {
          circleRef.current = new g.maps.Circle({
            center: pos,
            radius: radiusKm * 1000,
            map: mapRef.current,
            fillColor: "#0759F8",
            fillOpacity: 0.08,
            strokeColor: "#0759F8",
            strokeOpacity: 0.5,
            strokeWeight: 1,
          });
          mapRef.current.fitBounds(circleRef.current.getBounds());
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [latitude, longitude, radiusKm]);

  if (!hasGoogleMapsKey || latitude == null || longitude == null) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4 text-center text-xs text-muted-foreground"
        style={{ height }}
      >
        <MapPin size={18} aria-hidden="true" />
        Selecione um endereço para visualizar no mapa.
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-5 text-center"
        style={{ height }}
      >
        <MapPin size={22} className="text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Não foi possível carregar o mapa</p>
          <p className="text-xs text-muted-foreground">A visualização pode estar indisponível no momento.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openInGoogleMaps}
          className="h-9 gap-1.5 rounded-full border-primary/30 text-xs font-medium text-primary hover:bg-primary/5"
        >
          <ExternalLink size={13} aria-hidden="true" />
          Abrir no Google Maps
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/70" style={{ height }}>
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex animate-pulse items-center justify-center bg-muted/50 text-xs text-muted-foreground">
          Carregando mapa…
        </div>
      )}
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}
