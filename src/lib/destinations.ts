export type Destination = { value: string; label: string; aliases: string[] };
type Country = { code: string; name: string; active: boolean };
type City = { name: string; country: string; active: boolean };
const EUROPE = "AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA".split(" ");
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function destinationOptions(locale: string, countries?: Country[], cities: City[] = []): Destination[] {
  const localized = new Intl.DisplayNames([locale], { type: "region" });
  const english = new Intl.DisplayNames(["en"], { type: "region" });
  const rows = countries ?? EUROPE.map((code) => ({ code, name: english.of(code) ?? code, active: true }));
  return [
    ...rows.filter((c) => c.active).map((c) => ({ value: c.name, label: localized.of(c.code) ?? c.name, aliases: [c.name, c.code] })),
    ...cities.filter((c) => c.active).map((c) => ({ value: c.name, label: `${c.name}, ${c.country}`, aliases: [c.name] })),
  ];
}

export function matchingDestinations(options: Destination[], query: string): Destination[] {
  const q = normalize(query);
  return options.filter((o) => [o.label, ...o.aliases].some((v) => normalize(v).includes(q))).slice(0, 12);
}