import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps, hasGoogleMapsKey } from "@/lib/googleMapsLoader";
import { searchAddressesFn } from "@/lib/geocode.functions";


export interface ResolvedAddress {
  formatted_address: string | null;
  street: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
}

interface Suggestion {
  placeId: string;
  primary: string;
  secondary: string;
  /** preenchido quando a sugestão vem do fallback server-side */
  resolved?: ResolvedAddress;
}

interface Props {
  initialQuery?: string;
  onSelect: (addr: ResolvedAddress) => void;
  placeholder?: string;
}

export function AddressAutocomplete({ initialQuery = "", onSelect, placeholder }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(!hasGoogleMapsKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionTokenRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placesLibRef = useRef<any>(null);
  const debRef = useRef<number | null>(null);
  const lastPickedRef = useRef<string>(initialQuery);

  useEffect(() => {
    if (!hasGoogleMapsKey) return;
    loadGoogleMaps()
      .then(async (g) => {
        const lib = await g.maps.importLibrary("places");
        placesLibRef.current = lib;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessionTokenRef.current = new (lib as any).AutocompleteSessionToken();
        setReady(true);
        setGoogleFailed(false);
      })
      .catch((err) => {
        console.error("[AddressAutocomplete] Google Maps indisponível:", err);
        setReady(false);
        setGoogleFailed(true);
      });
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || q === lastPickedRef.current) {
      setItems([]);
      return;
    }
    if (!ready && !googleFailed) return; // ainda carregando o Google

    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(async () => {
      setBusy(true);
      try {
        if (ready) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AutocompleteSuggestion = (placesLibRef.current as any).AutocompleteSuggestion;
            const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
              input: q,
              sessionToken: sessionTokenRef.current,
              includedRegionCodes: ["br"],
              language: "pt-BR",
            });
            const mapped: Suggestion[] = (suggestions ?? [])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .slice(0, 6)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((s: any) => {
                const p = s.placePrediction;
                return {
                  placeId: p.placeId,
                  primary: p.mainText?.text ?? p.text?.text ?? "",
                  secondary: p.secondaryText?.text ?? "",
                };
              });
            setItems(mapped);
            setOpen(mapped.length > 0);
            return;
          } catch (err) {
            console.error("[AddressAutocomplete] falha no Places, usando fallback:", err);
          }
        }
        // Fallback server-side (Photon) — funciona sem Google
        const hits = await searchAddressesFn({ data: { q } });
        const mapped: Suggestion[] = (hits ?? []).map((h) => ({
          placeId: h.id,
          primary: h.primary,
          secondary: h.secondary,
          resolved: { ...h, google_place_id: null },
        }));
        setItems(mapped);
        setOpen(mapped.length > 0);
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => {
      if (debRef.current) window.clearTimeout(debRef.current);
    };
  }, [query, ready, googleFailed]);


  async function pick(item: Suggestion) {
    if (item.resolved) {
      onSelect(item.resolved);
      setQuery(item.resolved.formatted_address ?? "");
      lastPickedRef.current = item.resolved.formatted_address ?? "";
      setItems([]);
      setOpen(false);
      return;
    }
    try {
      setBusy(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Place = (placesLibRef.current as any).Place;
      const place = new Place({ id: item.placeId });
      await place.fetchFields({
        fields: ["addressComponents", "formattedAddress", "location", "id"],
      });
      const comps = (place.addressComponents ?? []) as Array<{
        longText: string;
        shortText: string;
        types: string[];
      }>;
      const get = (t: string, short = false) => {
        const c = comps.find((x) => x.types.includes(t));
        return c ? (short ? c.shortText : c.longText) : null;
      };
      const resolved: ResolvedAddress = {
        formatted_address: place.formattedAddress ?? null,
        street: get("route"),
        address_number: get("street_number"),
        neighborhood: get("sublocality_level_1") || get("sublocality") || get("neighborhood"),
        city: get("administrative_area_level_2") || get("locality"),
        state: get("administrative_area_level_1", true),
        postal_code: get("postal_code"),
        country: get("country", true),
        latitude: place.location?.lat() ?? null,
        longitude: place.location?.lng() ?? null,
        google_place_id: place.id ?? item.placeId,
      };
      onSelect(resolved);
      setQuery(resolved.formatted_address ?? "");
      lastPickedRef.current = resolved.formatted_address ?? "";
      setItems([]);
      setOpen(false);
      // renova o token de sessão após uma seleção
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionTokenRef.current = new (placesLibRef.current as any).AutocompleteSessionToken();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }



  return (
    <div className="relative">
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder ?? "Digite o endereço, CEP ou local"}
          className="pl-8 pr-8"
        />
        {busy && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-popover shadow-lg">
          {items.map((it) => (
            <li key={it.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(it)}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium text-foreground">{it.primary}</span>
                <span className="text-xs text-muted-foreground">{it.secondary}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
