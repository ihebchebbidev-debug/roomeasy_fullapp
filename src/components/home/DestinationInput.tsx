import { useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { request } from "@/api/http/client";
import { catalogEnabled, type CityDto, type CountryDto } from "@/api/http/catalog.http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/LanguageProvider";
import { destinationOptions, matchingDestinations } from "@/lib/destinations";

export function DestinationInput({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const { data: countries } = useQuery({ queryKey: ["destination-countries"], queryFn: () => request<CountryDto[]>("/content/countries"), enabled: catalogEnabled, staleTime: 300_000, retry: 1 });
  const { data: cities } = useQuery({ queryKey: ["destination-cities"], queryFn: () => request<CityDto[]>("/content/cities"), enabled: catalogEnabled, staleTime: 300_000, retry: 1 });
  const options = useMemo(() => matchingDestinations(destinationOptions(locale, countries, cities), value), [locale, countries, cities, value]);
  const choose = (next: string) => { onChange(next); setOpen(false); setActive(-1); };
  return (
    <Popover open={open && options.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="min-w-0 w-full">
          <Input value={value} placeholder={placeholder} aria-label={label} role="combobox" aria-autocomplete="list" aria-expanded={open && options.length > 0} aria-controls={id} aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} autoComplete="off"
            onFocus={() => setOpen(true)} onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setOpen(false); setActive(-1); }
              if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive((i) => e.key === "ArrowDown" ? Math.min(i + 1, options.length - 1) : Math.max(i - 1, 0)); }
              if (e.key === "Enter" && open && active >= 0) { const option = options[active]; if (option) { e.preventDefault(); choose(option.value); } }
              if (e.key === "Tab") setOpen(false);
            }} className="h-auto border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0" />
        </div>
      </PopoverAnchor>
      <PopoverContent side="top" align="start" className="max-h-72 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto p-1.5" onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => { if (e.target instanceof Element && e.target.closest('[role="combobox"]')) e.preventDefault(); }}>
        <div id={id} role="listbox" aria-label={label}>
          {options.map((option, i) => <Button key={`${option.value}-${option.label}`} id={`${id}-${i}`} role="option" aria-selected={i === active} type="button" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(option.value)} className="h-auto w-full justify-start whitespace-normal px-3 py-2.5 text-left"><MapPin className="size-4 shrink-0 text-primary" aria-hidden /><span>{option.label}</span></Button>)}
        </div>
      </PopoverContent>
    </Popover>
  );
}