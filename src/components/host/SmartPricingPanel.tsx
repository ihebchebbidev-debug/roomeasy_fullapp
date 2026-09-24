import { Plus } from "lucide-react";
import { DeleteIconButton } from "@/components/ui/action-buttons";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { request } from "@/api/http/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ruleSummary, useSmartPricingCopy } from "@/i18n/smartPricingCopy";
import { defaultSmartPricingRules, type NightPriceResult, type SmartPricingRules } from "@/lib/smartPricingEngine";

type Props = { listings: { propertyId: string; name?: string; title?: string }[] };


function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="h-9" />
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

function RuleBlock({ title, enabled, onToggle, children }: { title: string; enabled: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={title} />
      </div>
      {enabled ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div> : null}
    </div>
  );
}

export function SmartPricingPanel({ listings }: Props) {
  const c = useSmartPricingCopy();
  const [propertyId, setPropertyId] = useState(listings[0]?.propertyId ?? "");
  const [rules, setRules] = useState<SmartPricingRules>(defaultSmartPricingRules());
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [preview, setPreview] = useState<NightPriceResult[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    request<{ rules: SmartPricingRules; basePrice: number }>(`/host/listings/${encodeURIComponent(propertyId)}/smart-pricing`)
      .then((data) => {
        setRules(data.rules);
        setBasePrice(data.basePrice);
        setPreview([]);
      })
      .catch(() => toast.error(c.loadFailed));
  }, [propertyId]);

  const set = (patch: Partial<SmartPricingRules>) => setRules((current) => ({ ...current, ...patch }));

  async function runPreview() {
    setBusy(true);
    try {
      const data = await request<{ nights: NightPriceResult[] }>(
        `/host/listings/${encodeURIComponent(propertyId)}/smart-pricing/preview`,
        { method: "POST", body: { rules, days: 60 } },
      );
      setPreview(data.nights);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c.previewFailed);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      await request(`/host/listings/${encodeURIComponent(propertyId)}/smart-pricing`, { method: "PUT", body: rules });
      toast.success(c.saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  if (!listings.length) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6 lg:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{c.title}</h2>
          <p className="text-sm text-muted-foreground">
            {c.intro}
            {basePrice !== null ? ` ${c.base.replace("{price}", String(basePrice))}` : ""}
          </p>
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          aria-label={c.listing}
        >
          {listings.map((l) => (
            <option key={l.propertyId} value={l.propertyId}>
              {l.name ?? l.title ?? l.propertyId}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <RuleBlock title={c.weekend} enabled={rules.weekend.enabled} onToggle={(v) => set({ weekend: { ...rules.weekend, enabled: v } })}>
          <NumberField label={c.change} suffix="%" value={rules.weekend.percent} onChange={(v) => set({ weekend: { ...rules.weekend, percent: v } })} />
        </RuleBlock>

        <RuleBlock title={c.earlyBird} enabled={rules.leadTime.earlyBird.enabled} onToggle={(v) => set({ leadTime: { ...rules.leadTime, earlyBird: { ...rules.leadTime.earlyBird, enabled: v } } })}>
          <NumberField label={c.atLeastDays} value={rules.leadTime.earlyBird.days} onChange={(v) => set({ leadTime: { ...rules.leadTime, earlyBird: { ...rules.leadTime.earlyBird, days: v } } })} />
          <NumberField label={c.discount} suffix="%" value={rules.leadTime.earlyBird.percent} onChange={(v) => set({ leadTime: { ...rules.leadTime, earlyBird: { ...rules.leadTime.earlyBird, percent: v } } })} />
        </RuleBlock>

        <RuleBlock title={c.lastMinute} enabled={rules.leadTime.lastMinute.enabled} onToggle={(v) => set({ leadTime: { ...rules.leadTime, lastMinute: { ...rules.leadTime.lastMinute, enabled: v } } })}>
          <NumberField label={c.withinDays} value={rules.leadTime.lastMinute.days} onChange={(v) => set({ leadTime: { ...rules.leadTime, lastMinute: { ...rules.leadTime.lastMinute, days: v } } })} />
          <NumberField label={c.discount} suffix="%" value={rules.leadTime.lastMinute.percent} onChange={(v) => set({ leadTime: { ...rules.leadTime, lastMinute: { ...rules.leadTime.lastMinute, percent: v } } })} />
        </RuleBlock>

        <RuleBlock title={c.occupancy} enabled={rules.occupancy.enabled} onToggle={(v) => set({ occupancy: { ...rules.occupancy, enabled: v } })}>
          <NumberField label={c.windowDays} value={rules.occupancy.windowDays} onChange={(v) => set({ occupancy: { ...rules.occupancy, windowDays: v } })} />
          <div />
          <NumberField label={c.highThreshold} suffix="%" value={rules.occupancy.highThreshold} onChange={(v) => set({ occupancy: { ...rules.occupancy, highThreshold: v } })} />
          <NumberField label={c.raiseBy} suffix="%" value={rules.occupancy.highPercent} onChange={(v) => set({ occupancy: { ...rules.occupancy, highPercent: v } })} />
          <NumberField label={c.lowThreshold} suffix="%" value={rules.occupancy.lowThreshold} onChange={(v) => set({ occupancy: { ...rules.occupancy, lowThreshold: v } })} />
          <NumberField label={c.changeBy} suffix="%" value={rules.occupancy.lowPercent} onChange={(v) => set({ occupancy: { ...rules.occupancy, lowPercent: v } })} />
        </RuleBlock>

        <RuleBlock title={c.gap} enabled={rules.gapNight.enabled} onToggle={(v) => set({ gapNight: { ...rules.gapNight, enabled: v } })}>
          <NumberField label={c.gapMax} value={rules.gapNight.maxGapNights} onChange={(v) => set({ gapNight: { ...rules.gapNight, maxGapNights: v } })} />
          <NumberField label={c.discount} suffix="%" value={rules.gapNight.percent} onChange={(v) => set({ gapNight: { ...rules.gapNight, percent: v } })} />
        </RuleBlock>

        <div className="rounded-md border border-border p-4">
          <p className="text-sm font-semibold">{c.minMax}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{c.min}</Label>
              <Input type="number" value={rules.floorUsd ?? ""} placeholder={c.none} onChange={(e) => set({ floorUsd: e.target.value === "" ? null : Number(e.target.value) })} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{c.max}</Label>
              <Input type="number" value={rules.ceilingUsd ?? ""} placeholder={c.none} onChange={(e) => set({ ceilingUsd: e.target.value === "" ? null : Number(e.target.value) })} className="h-9" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{c.seasons}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              set({
                seasonal: [
                  ...rules.seasonal,
                  { id: crypto.randomUUID(), label: c.newSeason, startDate: "", endDate: "", percent: 20, enabled: true },
                ],
              })
            }
          >
            <Plus className="size-4" aria-hidden /> {c.addSeason}
          </Button>
        </div>
        {rules.seasonal.map((period, index) => {
          const update = (patch: Partial<typeof period>) =>
            set({ seasonal: rules.seasonal.map((p, i) => (i === index ? { ...p, ...patch } : p)) });
          return (
            <div key={period.id} className="mt-3 grid items-end gap-2 sm:grid-cols-[1fr_auto_auto_6rem_auto_auto]">
              <Input value={period.label} onChange={(e) => update({ label: e.target.value })} aria-label={c.seasonName} className="h-9" />
              <Input type="date" value={period.startDate} onChange={(e) => update({ startDate: e.target.value })} aria-label={c.from} className="h-9" />
              <Input type="date" value={period.endDate} onChange={(e) => update({ endDate: e.target.value })} aria-label={c.to} className="h-9" />
              <Input type="number" value={period.percent} onChange={(e) => update({ percent: Number(e.target.value) || 0 })} aria-label={c.change} className="h-9" />
              <Switch checked={period.enabled} onCheckedChange={(v) => update({ enabled: v })} aria-label={c.seasonOn} />
              <DeleteIconButton itemName={period.label || undefined} onConfirm={() => set({ seasonal: rules.seasonal.filter((_, i) => i !== index) })} />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void runPreview()} disabled={busy || !propertyId}>
          {c.preview}
        </Button>
        <Button
          onClick={() => void save()}
          disabled={busy || !propertyId || rules.seasonal.some((p) => !p.startDate || !p.endDate || p.startDate > p.endDate)}
        >
          {c.save}
        </Button>
      </div>

      {preview.length ? (
        <div className="mt-5 grid max-h-96 gap-1 overflow-y-auto text-sm">
          {preview.map((night) => (
            <div key={night.date} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-1.5">
              <span className="tabular-nums">{night.date}</span>
              <span className="text-xs text-muted-foreground">
                {night.applied.length ? ruleSummary(c, night.applied) : c.basePrice}
              </span>
              <span className="font-semibold tabular-nums">{night.finalPrice} €</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
