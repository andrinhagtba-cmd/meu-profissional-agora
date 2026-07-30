import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ALL_REGIONS, searchDfRegions } from "@/data/dfRegions";

interface Props {
  value: string;
  onChange: (name: string) => void;
  id?: string;
  placeholder?: string;
  ariaInvalid?: boolean;
}

export function DfRegionCombobox({
  value,
  onChange,
  id,
  placeholder = "Selecione sua região (DF e Entorno)",
  ariaInvalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = searchDfRegions(query);
  const dfResults = results.filter((r) => r.group !== "Entorno");
  const entornoResults = results.filter((r) => r.group === "Entorno");
  const selected = ALL_REGIONS.find((r) => r.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          className={cn(
            "mt-2 h-12 w-full justify-between rounded-xl px-3 font-normal",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <MapPin size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{selected ? selected.name : placeholder}</span>
          </span>
          <ChevronsUpDown size={16} className="ml-2 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="z-50 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar região... (ex: Taguatinga, Valparaíso)"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[min(60vh,320px)]">
            <CommandEmpty>Nenhuma região encontrada.</CommandEmpty>
            {[
              { label: "Distrito Federal", list: dfResults },
              { label: "Entorno do DF (RIDE)", list: entornoResults },
            ]
              .filter((g) => g.list.length > 0)
              .map((g) => (
                <CommandGroup key={g.label} heading={g.label}>
                  {g.list.map((r) => (
                    <CommandItem
                      key={r.slug}
                      value={r.slug}
                      onSelect={() => {
                        onChange(r.name);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <Check
                        size={16}
                        className={cn("mr-2", value === r.name ? "opacity-100" : "opacity-0")}
                      />
                      <span className="flex-1">{r.name}</span>
                      <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                        {r.raNumber}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
          </CommandList>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
