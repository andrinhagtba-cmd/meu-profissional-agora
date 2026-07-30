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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionTokenRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placesLibRef = useRef<any>(null);
  const debRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasGoogleMapsKey) return;
    loadGoogleMaps()
      .then(async (g) => {
        const lib = await g.maps.importLibrary("places");
        placesLibRef.current = lib;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessionTokenRef.current = new (lib as any).AutocompleteSessionToken();
        setReady(true);
      })
      .catch(() => setReady(false));
  }, []);

  useEffect(() => {
    if (!ready || !query.trim() || query === initialQuery) {
      setItems([]);
      return;
    }
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(async () => {
      try {
        setBusy(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AutocompleteSuggestion = (placesLibRef.current as any).AutocompleteSuggestion;
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["br"],
          language: "pt-BR",
        });
        setItems(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (suggestions ?? []).slice(0, 6).map((s: any) => {
            const p = s.placePrediction;
            return {
              placeId: p.placeId,
              primary: p.mainText?.text ?? p.text?.text ?? "",
              secondary: p.secondaryText?.text ?? "",
            };
          }),
        );
        setOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      if (debRef.current) window.clearTimeout(debRef.current);
    };
  }, [query, ready, initialQuery]);

  async function pick(placeId: string) {
    try {
      setBusy(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Place = (placesLibRef.current as any).Place;
      const place = new Place({ id: placeId });
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
        google_place_id: place.id ?? placeId,
      };
      onSelect(resolved);
      setQuery(resolved.formatted_address ?? "");
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

  if (!hasGoogleMapsKey) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
        Google Maps não configurado. Preencha o endereço manualmente abaixo.
      </div>
    );
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
                onClick={() => pick(it.placeId)}
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
