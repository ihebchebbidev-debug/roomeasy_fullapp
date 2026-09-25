import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export const PAGE_SIZE = 20;

const listCopy = {
  en: { search: "Search…", searchLabel: "Search", clear: "Clear", results: "result(s)", filter: "Filter", all: "All", of: "of", previous: "Previous", next: "Next" },
  fr: { search: "Rechercher…", searchLabel: "Rechercher", clear: "Effacer", results: "résultat(s)", filter: "Filtrer", all: "Tous", of: "sur", previous: "Précédent", next: "Suivant" },
  es: { search: "Buscar…", searchLabel: "Buscar", clear: "Borrar", results: "resultado(s)", filter: "Filtrar", all: "Todos", of: "de", previous: "Anterior", next: "Siguiente" },
  de: { search: "Suchen…", searchLabel: "Suchen", clear: "Löschen", results: "Ergebnis(se)", filter: "Filtern", all: "Alle", of: "von", previous: "Zurück", next: "Weiter" },
  pt: { search: "Pesquisar…", searchLabel: "Pesquisar", clear: "Limpar", results: "resultado(s)", filter: "Filtrar", all: "Todos", of: "de", previous: "Anterior", next: "Seguinte" },
};

export type ListFilter<T> = { value: string; label: string; test: (row: T) => boolean };

/**
 * Shared search + filter chips + numbered pagination for every list
 * (admin, host and guest pages), so they all look and behave the same.
 */
export function useListControls<T>(
  rows: T[] | null | undefined,
  options: { text: (row: T) => string; filters?: ListFilter<T>[] | undefined },
) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [query, filter]);

  const all = rows ?? [];
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return all.filter((row) => {
      if (!q) return true;
      const text = options.text(row).toLowerCase();
      return text.includes(q) || (digits.length >= 3 && text.replace(/\D/g, "").includes(digits));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query]);

  const filters = options.filters ?? [];
  const active = filters.find((f) => f.value === filter);
  const filtered = active ? searched.filter(active.test) : searched;
  const counts: Record<string, number> = { all: searched.length };
  for (const f of filters) counts[f.value] = searched.filter(f.test).length;

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;

  return {
    query, setQuery, filter, setFilter, filters, counts,
    page: current, pages, setPage, start,
    visible: filtered.slice(start, start + PAGE_SIZE),
    total: filtered.length,
    hasMore: pages > 1,
    more: () => setPage((p) => Math.min(p + 1, pages)),
  };
}

type Controls = ReturnType<typeof useListControls<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function ListToolbar({ controls, extra, placeholder }: {
  controls: Pick<Controls, "query" | "setQuery" | "filter" | "setFilter" | "filters" | "total"> & { counts?: Record<string, number> };
  extra?: ReactNode;
  placeholder?: string;
}) {
  const { locale } = useLanguage();
  const copy = listCopy[locale];
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={controls.query}
            onChange={(e) => controls.setQuery(e.target.value)}
            placeholder={placeholder ?? copy.search}
            className="h-11 rounded-full bg-surface pl-10 pr-10"
            aria-label={copy.searchLabel}
          />
          {controls.query ? (
            <button
              type="button"
              onClick={() => controls.setQuery("")}
              className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={copy.clear}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        {extra}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums sm:pl-2">
          {controls.total} {copy.results}
        </span>
      </div>
      {controls.filters.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={copy.filter}>
          {[{ value: "all", label: copy.all }, ...controls.filters].map((f) => {
            const on = controls.filter === f.value;
            const count = controls.counts?.[f.value];
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => controls.setFilter(f.value)}
                aria-pressed={on}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:bg-muted",
                )}
              >
                {f.label}
                {count !== undefined ? <span className={cn("tabular-nums", on ? "opacity-80" : "text-muted-foreground")}>{count}</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Numbered pagination shown under every list. */
export function ShowMore({ controls }: { controls: Pick<Controls, "visible" | "total"> & Partial<Pick<Controls, "page" | "pages" | "setPage" | "start">> }) {
  const { locale } = useLanguage();
  const copy = listCopy[locale];
  const { page = 1, pages = 1, setPage, start = 0 } = controls;
  if (!setPage || controls.total === 0) return null;

  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <span className="text-xs text-muted-foreground tabular-nums">
        {start + 1}–{start + controls.visible.length} {copy.of} {controls.total}
      </span>
      {pages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button variant="outline" size="icon" className="size-8 rounded-full" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label={copy.previous}>
            <ChevronLeft className="size-4" />
          </Button>
          {nums.map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
            ) : (
              <Button
                key={n}
                variant={n === page ? "default" : "ghost"}
                size="icon"
                className="size-8 rounded-full text-xs tabular-nums"
                onClick={() => setPage(n)}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </Button>
            ),
          )}
          <Button variant="outline" size="icon" className="size-8 rounded-full" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label={copy.next}>
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}

/** Render-prop version, safe to use after early returns. */
export function Paged<T>({ rows, text, filters, children }: {
  rows: T[] | null | undefined;
  text: (row: T) => string;
  filters?: ListFilter<T>[];
  children: (rows: T[]) => ReactNode;
}) {
  const controls = useListControls(rows, { text, filters });
  return (
    <>
      <div className="col-span-full"><ListToolbar controls={controls} /></div>
      {children(controls.visible)}
      <div className="col-span-full"><ShowMore controls={controls} /></div>
    </>
  );
}

/** Loose text for search: every string/number value of a row. */
export function rowText(row: unknown): string {
  const out: string[] = [];
  const walk = (v: unknown, depth: number) => {
    if (v == null || depth > 3) return;
    if (typeof v === "string" || typeof v === "number") out.push(String(v));
    else if (Array.isArray(v)) v.forEach((x) => walk(x, depth + 1));
    else if (typeof v === "object") Object.values(v as object).forEach((x) => walk(x, depth + 1));
  };
  walk(row, 0);
  return out.join(" ");
}
