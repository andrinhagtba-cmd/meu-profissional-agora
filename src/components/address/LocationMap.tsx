import { useEffect, useRef } from "react";
import { loadGoogleMaps, hasGoogleMapsKey } from "@/lib/googleMapsLoader";

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

  useEffect(() => {
    if (!hasGoogleMapsKey || latitude == null || longitude == null || !ref.current) return;
    let cancelled = false;
    loadGoogleMaps().then((g) => {
      if (cancelled || !ref.current) return;
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
    });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, radiusKm]);

  if (!hasGoogleMapsKey || latitude == null || longitude == null) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/40 text-xs text-muted-foreground"
        style={{ height }}
      >
        Selecione um endereço para visualizar no mapa.
      </div>
    );
  }

  return <div ref={ref} className="w-full overflow-hidden rounded-2xl border border-border/70" style={{ height }} />;
}
