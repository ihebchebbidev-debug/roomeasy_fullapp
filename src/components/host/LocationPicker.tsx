import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Locale } from "@/i18n/translations";

const LeafletPicker = lazy(() => import("@/components/host/LeafletPicker"));

type Keys = "street" | "streetPh" | "title" | "hint" | "find" | "mine" | "notFound" | "set" | "unset";
const copy: Record<Locale, Record<Keys, string>> = {
  en: { street: "Street address", streetPh: "Start typing the street and number…", title: "Exact location on the map", hint: "Click the map or drag the pin to the building. Guests see an approximate area until they book.", find: "Find the address on the map", mine: "Use my location", notFound: "That address wasn't found. Place the pin by hand.", set: "Pin placed", unset: "No pin yet — required to continue" },
  fr: { street: "Adresse (rue)", streetPh: "Tapez la rue et le numéro…", title: "Emplacement exact sur la carte", hint: "Cliquez sur la carte ou déplacez l'épingle jusqu'au bâtiment. Les voyageurs voient une zone approximative avant de réserver.", find: "Trouver l'adresse sur la carte", mine: "Utiliser ma position", notFound: "Adresse introuvable. Placez l'épingle à la main.", set: "Épingle placée", unset: "Pas encore d'épingle — obligatoire pour continuer" },
  es: { street: "Dirección (calle)", streetPh: "Escribe la calle y el número…", title: "Ubicación exacta en el mapa", hint: "Haz clic en el mapa o arrastra el marcador hasta el edificio. Los huéspedes ven una zona aproximada hasta reservar.", find: "Buscar la dirección en el mapa", mine: "Usar mi ubicación", notFound: "No se encontró la dirección. Coloca el marcador a mano.", set: "Marcador colocado", unset: "Aún sin marcador — obligatorio para continuar" },
  de: { street: "Straße und Hausnummer", streetPh: "Straße und Nummer eingeben…", title: "Genaue Lage auf der Karte", hint: "Klicken Sie auf die Karte oder ziehen Sie die Nadel zum Gebäude. Gäste sehen bis zur Buchung nur einen ungefähren Bereich.", find: "Adresse auf der Karte finden", mine: "Meinen Standort verwenden", notFound: "Adresse nicht gefunden. Setzen Sie die Nadel von Hand.", set: "Nadel gesetzt", unset: "Noch keine Nadel — zum Fortfahren erforderlich" },
  pt: { street: "Morada (rua)", streetPh: "Escreva a rua e o número…", title: "Localização exata no mapa", hint: "Clique no mapa ou arraste o marcador até ao edifício. Os hóspedes veem uma zona aproximada até reservarem.", find: "Encontrar a morada no mapa", mine: "Usar a minha localização", notFound: "Morada não encontrada. Coloque o marcador à mão.", set: "Marcador colocado", unset: "Ainda sem marcador — obrigatório para continuar" },
};

type Coords = { lat: number; lng: number };

export function LocationPicker({
  value,
  address,
  city = "",
  country = "",
  onChange,
  invalid,
}: {
  value: Coords | null;
  address: string;
  city?: string;
  country?: string;
  onChange: (value: Coords) => void;
  invalid?: boolean;
}) {
  const { locale } = useLanguage();
  const c = copy[locale] ?? copy.en;
  const [center, setCenter] = useState(() => (value ? { ...value, zoom: 16 } : { lat: 36.8065, lng: 10.1815, zoom: 5 }));
  const [busy, setBusy] = useState(false);
  const valueKey = value ? `${value.lat},${value.lng}` : "";
  useEffect(() => {
    if (value) setCenter((cur) => (Math.abs(cur.lat - value.lat) > 0.05 || Math.abs(cur.lng - value.lng) > 0.05 ? { ...value, zoom: 13 } : cur));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey]);

  const [street, setStreet] = useState("");
  const [hits, setHits] = useState<{ label: string; lat: number; lng: number }[]>([]);
  useEffect(() => {
    const q = street.trim();
    if (q.length < 3) { setHits([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent([q, city, country].filter(Boolean).join(", "))}`,
          { headers: { "Accept-Language": locale }, signal: ctrl.signal },
        );
        const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
        setHits(rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) })));
      } catch { /* aborted */ }
    }, 450);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [street, city, country, locale]);

  function pickHit(h: { label: string; lat: number; lng: number }) {
    const next = { lat: h.lat, lng: h.lng };
    onChange(next);
    setCenter({ ...next, zoom: 18 });
    setStreet(h.label.split(",").slice(0, 2).join(","));
    setHits([]);
  }

  async function findAddress() {
    if (!address.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        { headers: { "Accept-Language": locale } },
      );
      const hits = (await res.json()) as { lat: string; lon: string }[];
      if (!hits[0]) throw new Error("none");
      const next = { lat: Number(hits[0].lat), lng: Number(hits[0].lon) };
      onChange(next);
      setCenter({ ...next, zoom: 16 });
    } catch {
      toast.error(c.notFound);
    } finally {
      setBusy(false);
    }
  }

  function useMine() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      onChange(next);
      setCenter({ ...next, zoom: 18 });
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-base font-bold">{c.title}</p>
        <p className="text-sm text-muted-foreground">{c.hint}</p>
      </div>
      <div className="relative">
        <label className="mb-1.5 block text-sm font-medium">{c.street}</label>
        <input
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder={c.streetPh}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {hits.length > 0 ? (
          <ul className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            {hits.map((h) => (
              <li key={`${h.lat},${h.lng}`}>
                <button type="button" onClick={() => pickHit(h)} className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="line-clamp-2">{h.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={findAddress} disabled={busy || !address.trim()}>
          <Search className="size-4" aria-hidden /> {c.find}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={useMine}>
          <LocateFixed className="size-4" aria-hidden /> {c.mine}
        </Button>
      </div>
      <div className={`h-80 overflow-hidden rounded-lg border ${invalid ? "border-destructive" : "border-border"}`}>
        <ClientOnly fallback={<div className="size-full bg-muted" />}>
          <Suspense fallback={<div className="size-full bg-muted" />}>
            <LeafletPicker value={value} center={center} onChange={onChange} />
          </Suspense>
        </ClientOnly>
      </div>
      <p className={`flex items-center gap-1.5 text-xs ${value ? "text-muted-foreground" : invalid ? "text-destructive" : "text-muted-foreground"}`}>
        <MapPin className="size-3.5" aria-hidden />
        {value ? `${c.set} · ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : c.unset}
      </p>
    </div>
  );
}
