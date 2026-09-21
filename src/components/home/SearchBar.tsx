import { format } from "date-fns";
import { CalendarDays, Check, Loader2, MapPin, Minus, Navigation, Plus, Search, Users, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateFnsLocale } from "@/i18n/dateLocale";
import { useClientCopy } from "@/i18n/clientCopy";
import { interpolate, useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { cityName } from "@/data/properties";
import { useAllProperties } from "@/hooks/useAllProperties";

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-secondary/70 focus-within:bg-secondary/70 sm:px-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-secondary/40 text-muted-foreground transition-colors group-hover:text-foreground">
        {icon}
      </span>

      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

export function SearchBar() {
  const { t, locale } = useLanguage();
  const cc = useClientCopy();
  const dateLocale = dateFnsLocale(locale);

  const [where, setWhere] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [whereOpen, setWhereOpen] = useState(false);
  const navigate = useNavigate();
  const catalogue = useAllProperties();
  const destinations = [...new Set(catalogue.map((property) => cityName(property, locale)))].sort();
  const query = where.trim().toLowerCase();
  const matchingDestinations = query
    ? destinations.filter((destination) => destination.toLowerCase().includes(query))
    : destinations;

  const dateLabel = range?.from
    ? `${format(range.from, "dd MMM yyyy", { locale: dateLocale })}${
        range.to ? ` – ${format(range.to, "dd MMM yyyy", { locale: dateLocale })}` : ""
      }`
    : null;

  function submit() {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      toast.success(
        interpolate(t.search.submitted, { where: where || cc.wherePlaceholder }),
      );
      void navigate({
        to: "/stays",
        search: {
          where: where.trim(),
          from: range?.from ? format(range.from, "yyyy-MM-dd") : "",
          to: range?.to ? format(range.to, "yyyy-MM-dd") : "",
          guests: adults + children,
          rooms,
          category: "all",
          maxPrice: 400,
          rating: 0,
          beds: 0,
          sort: "recommended",
        },
      });
    }, 700);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-1 rounded-[1.5rem] border border-border/60 bg-surface p-2 shadow-[0_28px_70px_-28px_rgb(0_0_0/0.45)] ring-1 ring-white/40 transition-shadow hover:shadow-[0_34px_80px_-28px_rgb(0_0_0/0.5)] sm:rounded-full lg:grid-cols-[1.1fr_1.2fr_1fr_auto]"
    >
      <div className="relative">
        <Field icon={<Navigation className="size-4" aria-hidden />} label={t.search.where}>
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            onFocus={() => setWhereOpen(true)}
            onBlur={() => window.setTimeout(() => setWhereOpen(false), 120)}
            placeholder={cc.wherePlaceholder}
            aria-label={t.search.where}
            autoComplete="off"
            className="w-full bg-transparent text-sm font-semibold placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </Field>

        {whereOpen && matchingDestinations.length > 0 && (
          <div className="absolute bottom-full left-0 z-50 mb-2 max-h-72 w-full min-w-[16rem] overflow-y-auto rounded-2xl border border-border/60 bg-surface p-1.5 shadow-[0_28px_70px_-28px_rgb(0_0_0/0.45)]">
            {matchingDestinations.map((destination) => (
              <button
                key={destination}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setWhere(destination);
                  setWhereOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/70"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary/60 text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <span className="truncate text-sm font-semibold">{destination}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" className="h-auto justify-start p-0 text-left font-normal">
            <Field icon={<CalendarDays className="size-4" aria-hidden />} label={t.search.date}>
              <span
                className={cn(
                  "block truncate text-sm font-semibold",
                  !dateLabel && "text-muted-foreground/70",
                )}
              >
                {dateLabel ?? t.search.datePlaceholder}
              </span>
            </Field>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden p-0" align="start">
          <div className="border-b border-border px-4 py-3">
            <p className="font-semibold">{t.search.chooseDates}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.search.dateHint}</p>
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            locale={dateLocale}
            disabled={{ before: new Date() }}
            fixedWeeks
            className={cn("pointer-events-auto mx-auto p-3 [--cell-size:2.4rem]")}
          />
          <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
            <Button type="button" variant="ghost" onClick={() => setRange(undefined)} disabled={!range?.from}>
              <X aria-hidden />{t.search.clear}
            </Button>
            <Button type="button" onClick={() => setDateOpen(false)} disabled={!range?.from}>
              <Check aria-hidden />{t.search.apply}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={guestOpen} onOpenChange={setGuestOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" className="h-auto justify-start p-0 text-left font-normal">
            <Field icon={<Users className="size-4" aria-hidden />} label={t.search.who}>
              <span className="block truncate text-sm font-semibold">
                {`${adults + children} ${t.listings.guests.toLowerCase()} · ${rooms} ${cc.rooms.toLowerCase()}`}
              </span>
            </Field>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3 p-4">
          {(
            [
              [t.search.adults, adults, setAdults, 1],
              [t.search.children, children, setChildren, 0],
              [cc.rooms, rooms, setRooms, 1],
            ] as const
          ).map(([label, value, setValue, min]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`- ${label}`}
                  onClick={() => setValue(Math.max(min, value - 1))}
                  disabled={value <= min}
                  className="size-8 rounded-full"
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-4 text-center text-sm font-semibold tabular-nums">{value}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`+ ${label}`}
                  onClick={() => setValue(Math.min(12, value + 1))}
                  className="size-8 rounded-full"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" className="mt-2 w-full" onClick={() => setGuestOpen(false)}>{t.search.apply}</Button>
        </PopoverContent>
      </Popover>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 rounded-2xl px-8 font-bold shadow-[0_10px_24px_-10px_var(--primary)] transition-transform hover:scale-[1.02] active:scale-95 sm:h-auto sm:rounded-full"
      >

        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Search className="size-4" aria-hidden />
        )}
        {loading ? t.search.searching : t.search.search}
      </Button>
    </form>
  );
}
