import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const compact = (value: number) =>
  Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : String(Math.round(value));

export function ChartPanel({ title, subtitle, children, className, action }: { title: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6", className)}>
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold sm:text-lg">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string | undefined; tone?: "default" | "primary" | "success" | "danger" }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-3 shadow-sm sm:p-4">
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn(
        "mt-1 truncate font-display text-lg font-bold tabular-nums sm:text-2xl",
        tone === "primary" && "text-primary",
        tone === "success" && "text-emerald-600 dark:text-emerald-400",
        tone === "danger" && "text-destructive",
      )}>{value}</p>
      {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Vertical grouped bars over a category axis (months, periods). */
export function GroupedBars<T extends Record<string, unknown>>({ data, xKey, series, height = "h-64" }: {
  data: T[];
  xKey: keyof T & string;
  series: { key: keyof T & string; label: string }[];
  height?: string;
}) {
  const config: ChartConfig = Object.fromEntries(series.map((s, i) => [s.key, { label: s.label, color: CHART_COLORS[i % CHART_COLORS.length] ?? "var(--chart-1)" }]));
  return (
    <ChartContainer config={config} className={cn("aspect-auto w-full", height)}>
      <BarChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={compact} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.length > 1 ? <ChartLegend content={<ChartLegendContent />} /> : null}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[4, 4, 0, 0]} maxBarSize={36} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/** Horizontal ranking bars (hosts, places). */
export function RankingBars({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  const config: ChartConfig = { value: { label, color: "var(--chart-1)" } };
  const rows = data.map((d) => ({ ...d, name: d.name.length > 18 ? `${d.name.slice(0, 17)}…` : d.name }));
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(160, rows.length * 34 + 24) }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={compact} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ChartContainer>
  );
}

/** Donut with legend list next to it. */
export function Donut({ data, centerLabel }: { data: { name: string; value: number }[]; centerLabel?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const config: ChartConfig = Object.fromEntries(data.map((d, i) => [`s${i}`, { label: d.name, color: CHART_COLORS[i % CHART_COLORS.length] ?? "var(--chart-1)" }]));
  return (
    <div className="grid min-w-0 items-center gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="relative mx-auto size-44">
        <ChartContainer config={config} className="aspect-square size-44">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} strokeWidth={2}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
        {centerLabel ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-display text-2xl font-bold tabular-nums">{total}</p>
              <p className="text-[11px] text-muted-foreground">{centerLabel}</p>
            </div>
          </div>
        ) : null}
      </div>
      <ul className="min-w-0 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex min-w-0 items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{d.value} · {Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
