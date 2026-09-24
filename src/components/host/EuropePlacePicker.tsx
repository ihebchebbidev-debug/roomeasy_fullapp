import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** ISO codes of every European country. */
export const EUROPE_CODES = [
  "AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT",
  "XK","LV","LI","LT","LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU","SM","RS","SK","SI",
  "ES","SE","CH","UA","GB","VA",
];

const englishNames = new Intl.DisplayNames(["en"], { type: "region" });
const englishName = (code: string) => (code === "XK" ? "Kosovo" : englishNames.of(code) ?? code);

type CityRow = { name: string; lat: number; lng: number };
const cityCache = new Map<string, CityRow[]>();

async function loadCities(code: string): Promise<CityRow[]> {
  const hit = cityCache.get(code);
  if (hit) return hit;
  const { City } = await import("country-state-city");
  const seen = new Set<string>();
  const rows: CityRow[] = [];
  for (const c of City.getCitiesOfCountry(code) ?? []) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    rows.push({ name: c.name, lat: Number(c.latitude), lng: Number(c.longitude) });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  cityCache.set(code, rows);
  return rows;
}

const T = {
  en: { search: "Search…", pick: "Select", countryFirst: "Choose a country first", none: "No results", loading: "Loading…" },
  fr: { search: "Rechercher…", pick: "Sélectionner", countryFirst: "Choisissez d'abord un pays", none: "Aucun résultat", loading: "Chargement…" },
  es: { search: "Buscar…", pick: "Seleccionar", countryFirst: "Elige primero un país", none: "Sin resultados", loading: "Cargando…" },
  de: { search: "Suchen…", pick: "Auswählen", countryFirst: "Zuerst ein Land wählen", none: "Keine Ergebnisse", loading: "Lädt…" },
  pt: { search: "Pesquisar…", pick: "Selecionar", countryFirst: "Escolha primeiro um país", none: "Sem resultados", loading: "A carregar…" },
};

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Combo({
  value, options, onPick, disabled, placeholder, t, invalid, loading,
}: {
  value: string;
  options: { key: string; label: string }[];
  onPick: (key: string) => void;
  disabled?: boolean;
  placeholder: string;
  t: (typeof T)["en"];
  invalid?: boolean | undefined;
  loading?: boolean | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const n = norm(q.trim());
    const list = n ? options.filter((o) => norm(o.label).includes(n)) : options;
    return list.slice(0, 300);
  }, [q, options]);
  const current = options.find((o) => o.key === value)?.label ?? value;
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("h-10 w-full justify-between font-normal", invalid && "border-destructive", !current && "text-muted-foreground")}
        >
          <span className="truncate">{current || placeholder}</span>
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="mb-2" />
        <div className="max-h-64 overflow-y-auto">
          {loading ? <p className="p-2 text-sm text-muted-foreground">{t.loading}</p> : null}
          {!loading && shown.length === 0 ? <p className="p-2 text-sm text-muted-foreground">{t.none}</p> : null}
          {shown.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onPick(o.key); setOpen(false); setQ(""); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <Check className={cn("size-4", o.key === value ? "opacity-100" : "opacity-0")} aria-hidden />
              {o.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EuropePlacePicker({
  country, city, locale, countryLabel, cityLabel, countryInvalid, cityInvalid, onCountry, onCity,
}: {
  country: string;
  city: string;
  locale: string;
  countryLabel: string;
  cityLabel: string;
  countryInvalid?: boolean;
  cityInvalid?: boolean;
  onCountry: (englishName: string) => void;
  onCity: (city: string, coords: { lat: number; lng: number } | null) => void;
}) {
  const t = T[(locale as keyof typeof T)] ?? T.en;
  const countries = useMemo(() => {
    let local: Intl.DisplayNames | null = null;
    try { local = new Intl.DisplayNames([locale], { type: "region" }); } catch { /* ignore */ }
    return EUROPE_CODES.map((code) => ({
      key: englishName(code),
      label: code === "XK" ? "Kosovo" : local?.of(code) ?? englishName(code),
      code,
    })).sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [locale]);

  const code = countries.find((c) => norm(c.key) === norm(country) || norm(c.label) === norm(country))?.code;
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) { setCities([]); return; }
    let alive = true;
    setLoading(true);
    loadCities(code).then((rows) => { if (alive) { setCities(rows); setLoading(false); } });
    return () => { alive = false; };
  }, [code]);

  const cityOptions = useMemo(() => cities.map((c) => ({ key: c.name, label: c.name })), [cities]);

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium">{countryLabel}</label>
        <Combo
          value={countries.find((c) => c.code === code)?.key ?? country}
          options={countries}
          onPick={(k) => { if (k !== country) { onCountry(k); onCity("", null); } }}
          placeholder={t.pick}
          t={t}
          invalid={Boolean(countryInvalid)}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">{cityLabel}</label>
        <Combo
          value={city}
          options={cityOptions}
          onPick={(name) => {
            const row = cities.find((c) => c.name === name);
            onCity(name, row && Number.isFinite(row.lat) ? { lat: row.lat, lng: row.lng } : null);
          }}
          disabled={!code}
          placeholder={code ? t.pick : t.countryFirst}
          t={t}
          invalid={Boolean(cityInvalid)}
          loading={loading}
        />
      </div>
    </>
  );
}
