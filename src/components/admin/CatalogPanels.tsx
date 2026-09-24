import { Paged, rowText } from "@/components/admin/ListControls";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  catalogApi,
  type AmenityDto,
  type CityDto,
  type CityInput,
  type ContentPageDto,
  type CountryDto,
  type PropertyTypeAdminDto,
  type TranslationDto,
} from "@/api/http/catalog.http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DeleteIconButton, EditIconButton } from "@/components/ui/action-buttons";
import { RichTextEditor } from "@/components/legal/RichText";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const LOCALES = ["en", "fr", "es", "de", "pt"] as const;
const PAGE_SLUGS = ["terms", "privacy", "help"] as const;

function fail(error: unknown) {
  toast.error(error instanceof Error ? error.message : "Something went wrong.");
}

function useLoad<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    setLoading(true);
    loader()
      .then(setData)
      .catch(fail)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(reload, [reload]);
  return { data, loading, reload };
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function FormModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button size="sm" onClick={onClick}><Plus className="mr-1 h-4 w-4" />{label}</Button>;
}

const LOCALE_NAMES: Record<(typeof LOCALES)[number], string> = { en: "English", fr: "Français", es: "Español", de: "Deutsch", pt: "Português" };
const amenityKey = { en: "labelEn", fr: "labelFr", es: "labelEs", de: "labelDe", pt: "labelPt" } as const;

/* ------------------------------------------------------------------ amenities */

export function AmenitiesPanel() {
  const [search, setSearch] = useState("");
  const { data, loading, reload } = useLoad(() => catalogApi.amenities(), { items: [] as AmenityDto[], groups: [] as string[] });
  const emptyAmenity = { id: "", group: "", labelEn: "", labelFr: "", labelEs: "", labelDe: "", labelPt: "", paid: false, active: true };
  const [draft, setDraft] = useState(emptyAmenity);
  const [open, setOpen] = useState(false);
  const editingAmenity = data.items.some((i) => i.id === draft.id);
  const [busy, setBusy] = useState(false);

  const items = data.items.filter((item) =>
    `${item.id} ${item.label.en} ${item.label.fr} ${item.group}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function save(id: string, body: Omit<typeof draft, "id">) {
    setBusy(true);
    try {
      await catalogApi.saveAmenity(id, body);
      toast.success("Amenity saved.");
      reload();
      return true;
    } catch (error) {
      fail(error);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      const result = await catalogApi.removeAmenity(id);
      toast.success(result.deleted ? "Amenity removed." : "Amenity in use — retired instead.");
      reload();
    } catch (error) {
      fail(error);
    }
  }

  return (
    <div className="space-y-4">
      <FormModal open={open} onClose={() => setOpen(false)} title={editingAmenity ? `Edit "${draft.id}"` : "Add an amenity"}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const { id, ...body } = draft;
            if (await save(id.trim().toLowerCase(), body)) { setDraft({ ...emptyAmenity, group: draft.group }); setOpen(false); }
          }}
        >
          <div className="space-y-1">
            <Label>Code</Label>
            <Input required disabled={editingAmenity} pattern="[a-z0-9_-]{2,80}" placeholder="e.g. sauna" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Group</Label>
            <Input required list="amenity-groups" value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value })} />
            <datalist id="amenity-groups">
              {data.groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
          {LOCALES.map((l) => (
            <div key={l} className="space-y-1">
              <Label>Name — {LOCALE_NAMES[l]}{l === "en" || l === "fr" ? " *" : ""}</Label>
              <Input required={l === "en" || l === "fr"} value={draft[amenityKey[l]]} onChange={(e) => setDraft({ ...draft, [amenityKey[l]]: e.target.value })} />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.paid} onCheckedChange={(paid) => setDraft({ ...draft, paid })} /> Paid extra
          </label>
          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>Save amenity</Button>
          </div>
        </form>
      </FormModal>

      <Card title={`Amenities (${data.items.length})`} action={<AddButton label="Add an amenity" onClick={() => { setDraft({ ...emptyAmenity, group: draft.group }); setOpen(true); }} />}>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div className="divide-y divide-border">
          <Paged rows={items} text={rowText}>{(__rows) => __rows.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <code className="w-40 truncate text-xs text-muted-foreground">{item.id}</code>
              <span className="min-w-40 flex-1">
                {item.label.en} <span className="text-muted-foreground">/ {item.label.fr}</span>
              </span>
              <Badge variant="secondary">{item.group}</Badge>
              {item.paid ? <Badge variant="outline">Paid</Badge> : null}
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={item.active}
                  onCheckedChange={(active) =>
                    save(item.id, { group: item.group, labelEn: item.label.en, labelFr: item.label.fr, labelEs: item.label.es ?? "", labelDe: item.label.de ?? "", labelPt: item.label.pt ?? "", paid: item.paid, active })
                  }
                />
                {item.active ? "Active" : "Hidden"}
              </label>
              <EditIconButton onConfirm={() => { setDraft({ id: item.id, group: item.group, labelEn: item.label.en, labelFr: item.label.fr, labelEs: item.label.es ?? "", labelDe: item.label.de ?? "", labelPt: item.label.pt ?? "", paid: item.paid, active: item.active }); setOpen(true); }} />
              <DeleteIconButton itemName={item.label.en} onConfirm={() => remove(item.id)} />
            </div>
          ))}</Paged>
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------------------------------------------- cities */

const emptyCity: CityInput = { name: "", country: "", active: true, featured: false, sortOrder: 0 };

export function CitiesPanel() {
  const { data, loading, reload } = useLoad(() => catalogApi.cities(), [] as CityDto[]);
  const { data: countries } = useLoad(() => catalogApi.countries(), [] as CountryDto[]);
  const [draft, setDraft] = useState<CityInput & { id?: string }>(emptyCity);
  const [open, setOpen] = useState(false);

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
      reload();
    } catch (error) {
      fail(error);
    }
  }

  return (
    <div className="space-y-4">
      <FormModal open={open} onClose={() => setOpen(false)} title={draft.id ? "Edit city" : "Add a city"}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const { id, ...body } = draft;
            run(() => (id ? catalogApi.updateCity(id, body) : catalogApi.createCity(body)), "City saved.").then(() => { setDraft(emptyCity); setOpen(false); });
          }}
        >
          <div className="space-y-1">
            <Label>City</Label>
            <Input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Country</Label>
            <select
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="">Choose a country…</option>
              {draft.country && !countries.some((c) => c.name === draft.country) ? (
                <option value={draft.country}>{draft.country}</option>
              ) : null}
              {[...countries]
                .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}{c.active ? "" : " (hidden)"}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Order</Label>
            <Input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.featured} onCheckedChange={(featured) => setDraft({ ...draft, featured })} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.active} onCheckedChange={(active) => setDraft({ ...draft, active })} /> Active
            </label>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{draft.id ? "Update city" : "Add city"}</Button>
          </div>
        </form>
      </FormModal>

      <Card
        title={`Cities (${data.length})`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => run(async () => toast.info(`${(await catalogApi.importCities()).added} cities imported.`), "Import finished.")}>
              Import cities from listings
            </Button>
            <AddButton label="Add a city" onClick={() => { setDraft(emptyCity); setOpen(true); }} />
          </div>
        }
      >
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {!loading && data.length === 0 ? <p className="text-sm text-muted-foreground">No cities yet.</p> : null}
        <div className="divide-y divide-border">
          <Paged rows={data} text={rowText}>{(__rows) => __rows.map((city) => (
            <div key={city.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className="min-w-40 flex-1 font-medium">
                {city.name} <span className="font-normal text-muted-foreground">{city.country}</span>
              </span>
              <span className="text-xs text-muted-foreground">{city.listings} listings</span>
              {city.featured ? <Badge>Featured</Badge> : null}
              {!city.active ? <Badge variant="outline">Hidden</Badge> : null}
              <EditIconButton onConfirm={() => { setDraft({ id: city.id, name: city.name, country: city.country, active: city.active, featured: city.featured, sortOrder: city.sortOrder }); setOpen(true); }} />
<DeleteIconButton itemName={city.name} onConfirm={() => run(() => catalogApi.deleteCity(city.id), "City deleted.")} />
            </div>
          ))}</Paged>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------- content pages */

export function ContentPagesPanel() {
  const { data, reload } = useLoad(() => catalogApi.pages(), [] as ContentPageDto[]);
  const [slug, setSlug] = useState<string>("terms");
  const [locale, setLocale] = useState<string>("en");
  const [form, setForm] = useState({ title: "", body: "", published: true });
  const existing = data.find((p) => p.slug === slug && p.locale === locale);

  useEffect(() => {
    setForm(existing ? { title: existing.title, body: existing.body, published: existing.published } : { title: "", body: "", published: true });
  }, [existing, slug, locale]);

  async function save() {
    try {
      await catalogApi.savePage(slug, locale, form);
      toast.success("Page saved.");
      reload();
    } catch (error) {
      fail(error);
    }
  }

  async function remove() {
    try {
      await catalogApi.deletePage(slug, locale);
      toast.success("Page deleted.");
      reload();
    } catch (error) {
      fail(error);
    }
  }

  return (
    <Card title="Terms, Privacy and Help pages">
      <div className="flex flex-wrap gap-2">
        {PAGE_SLUGS.map((s) => (
          <Button key={s} size="sm" variant={s === slug ? "default" : "outline"} onClick={() => setSlug(s)}>
            {s}
          </Button>
        ))}
        <span className="mx-2 w-px bg-border" />
        {LOCALES.map((l) => (
          <Button key={l} size="sm" variant={l === locale ? "default" : "outline"} onClick={() => setLocale(l)}>
            {l.toUpperCase()}
            {data.some((p) => p.slug === slug && p.locale === l) ? " •" : ""}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {existing
          ? `Last saved ${new Date(existing.updatedAt).toLocaleString()}${existing.updatedBy ? ` by ${existing.updatedBy}` : ""}.`
          : "Not written yet — the public page shows the built-in text."}{" "}
        Use the toolbar for bold, italic, headings, lists and links — the public page shows it exactly the same.
      </p>
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Content</Label>
        <RichTextEditor value={form.body} onChange={(body) => setForm((f) => ({ ...f, body }))} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={form.published} onCheckedChange={(published) => setForm({ ...form, published })} /> Published
        </label>
        <Button onClick={save} disabled={!form.title.trim()}>Save page</Button>
        {existing ? (
          <DeleteIconButton label="Delete this version" onConfirm={remove} />
        ) : null}
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- translations */

export function TranslationsPanel() {
  const [locale, setLocale] = useState<string>("fr");
  const [rows, setRows] = useState<TranslationDto[]>([]);
  const [draft, setDraft] = useState({ key: "", value: "" });

  const reload = useCallback(() => {
    catalogApi.translations(locale).then(setRows).catch(fail);
  }, [locale]);
  useEffect(reload, [reload]);

  async function save(key: string, value: string) {
    try {
      await catalogApi.saveTranslation(locale, key, value);
      toast.success("Translation saved.");
      reload();
    } catch (error) {
      fail(error);
    }
  }

  return (
    <Card title="Translations">
      <p className="text-xs text-muted-foreground">
        Replace any text in the app for one language. Use the dotted key of the text, e.g. <code>app.admin.title</code> or{" "}
        <code>auth.login</code>. Changes appear for visitors within about a minute.
      </p>
      <div className="flex flex-wrap gap-2">
        {LOCALES.map((l) => (
          <Button key={l} size="sm" variant={l === locale ? "default" : "outline"} onClick={() => setLocale(l)}>
            {l.toUpperCase()}
          </Button>
        ))}
      </div>
      <form
        className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          save(draft.key.trim(), draft.value).then(() => setDraft({ key: "", value: "" }));
        }}
      >
        <Input required placeholder="Key" pattern="[A-Za-z0-9_.\-]{1,200}" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} />
        <Input required placeholder="New text" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
        <Button type="submit">Save</Button>
      </form>
      <div className="divide-y divide-border">
        {rows.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No custom texts for this language.</p> : null}
        <Paged rows={rows} text={rowText}>{(__rows) => __rows.map((row) => (
          <div key={row.key} className="flex flex-wrap items-center gap-3 py-2 text-sm">
            <code className="w-64 truncate text-xs text-muted-foreground">{row.key}</code>
            <span className="min-w-40 flex-1">{row.value}</span>
            <EditIconButton onConfirm={() => setDraft({ key: row.key, value: row.value })} />
            <DeleteIconButton onConfirm={() =>
                catalogApi
                  .deleteTranslation(locale, row.key)
                  .then(() => {
                    toast.success("Custom text removed.");
                    reload();
                  })
                  .catch(fail)
              } />
          </div>
        ))}</Paged>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- property types */

const emptyType = { id: "", labels: { en: "", fr: "", es: "", de: "", pt: "" }, active: true, sortOrder: 0 };

export function PropertyTypesPanel() {
  const { data, loading, reload } = useLoad(() => catalogApi.propertyTypes(), [] as PropertyTypeAdminDto[]);
  const [draft, setDraft] = useState(emptyType);
  const [open, setOpen] = useState(false);
  const editing = data.some((t) => t.id === draft.id);

  async function save(id: string, body: { labels: typeof emptyType.labels; active: boolean; sortOrder: number }) {
    try {
      await catalogApi.savePropertyType(id, body);
      toast.success("Property type saved.");
      reload();
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }

  return (
    <div className="space-y-4">
      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? `Edit "${draft.id}"` : "Add a property type"}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const { id, ...body } = draft;
            if (await save(id.trim().toLowerCase(), body)) { setDraft(emptyType); setOpen(false); }
          }}
        >
          <div className="space-y-1">
            <Label>Code</Label>
            <Input required disabled={editing} pattern="[a-z0-9_-]{2,40}" placeholder="e.g. houseboat" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
          </div>
          {LOCALES.map((l) => (
            <div key={l} className="space-y-1">
              <Label>Name — {LOCALE_NAMES[l]}{l === "en" ? " *" : ""}</Label>
              <Input
                required={l === "en"}
                value={draft.labels[l]}
                onChange={(e) => setDraft({ ...draft, labels: { ...draft.labels, [l]: e.target.value } })}
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label>Order</Label>
            <Input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} />
          </div>
          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Add type"}</Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground">The code can't be changed later. Empty names fall back to English.</p>
      </FormModal>

      <Card title={`Property types (${data.length})`} action={<AddButton label="Add a property type" onClick={() => { setDraft(emptyType); setOpen(true); }} />}>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div className="divide-y divide-border">
          <Paged rows={data} text={rowText}>{(__rows) => __rows.map((type) => (
            <div key={type.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <code className="w-32 truncate text-xs text-muted-foreground">{type.id}</code>
              <span className="min-w-40 flex-1">
                {type.labels.en} <span className="text-muted-foreground">/ {type.labels.fr || "—"}</span>
              </span>
              <span className="text-xs text-muted-foreground">{type.listings} listings</span>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={type.active} onCheckedChange={(active) => save(type.id, { labels: type.labels, active, sortOrder: type.sortOrder })} />
                {type.active ? "Active" : "Hidden"}
              </label>
              <EditIconButton onConfirm={() => { setDraft({ id: type.id, labels: type.labels, active: type.active, sortOrder: type.sortOrder }); setOpen(true); }} />
              <DeleteIconButton onConfirm={async () => {
                  try {
                    const r = await catalogApi.removePropertyType(type.id);
                    toast.success(r.deleted ? "Type removed." : "Type in use — hidden instead.");
                    reload();
                  } catch (error) {
                    fail(error);
                  }
                }} />
            </div>
          ))}</Paged>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ countries */

const emptyCountry = { code: "", name: "", active: true, sortOrder: 0 };

export function CountriesPanel() {
  const { data, loading, reload } = useLoad(() => catalogApi.countries(), [] as CountryDto[]);
  const [draft, setDraft] = useState(emptyCountry);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const editing = data.some((c) => c.code === draft.code.toUpperCase());

  async function save(code: string, body: { name: string; active: boolean; sortOrder: number }) {
    try {
      await catalogApi.saveCountry(code, body);
      toast.success("Country saved.");
      reload();
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }

  const rows = data.filter((c) => `${c.code} ${c.name}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <FormModal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${draft.code.toUpperCase()}` : "Add a country"}>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const { code, ...body } = draft;
            if (await save(code.trim().toUpperCase(), body)) { setDraft(emptyCountry); setOpen(false); }
          }}
        >
          <div className="space-y-1">
            <Label>2-letter code</Label>
            <Input required disabled={editing} maxLength={2} pattern="[A-Za-z]{2}" placeholder="e.g. TN" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-1">
            <Label>Name (English)</Label>
            <Input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Order</Label>
            <Input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} />
          </div>
          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? "Update" : "Add country"}</Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground">
          Hosts can only pick active countries. Other languages show the country name automatically from its code.
        </p>
      </FormModal>

      <Card title={`Countries (${data.length})`} action={<AddButton label="Add a country" onClick={() => { setDraft(emptyCountry); setOpen(true); }} />}>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div className="divide-y divide-border">
          <Paged rows={rows} text={rowText}>{(__rows) => __rows.map((c) => (
            <div key={c.code} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <code className="w-10 text-xs text-muted-foreground">{c.code}</code>
              <span className="min-w-40 flex-1">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.listings} listings</span>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={c.active} onCheckedChange={(active) => save(c.code, { name: c.name, active, sortOrder: c.sortOrder })} />
                {c.active ? "Active" : "Hidden"}
              </label>
              <EditIconButton onConfirm={() => { setDraft({ code: c.code, name: c.name, active: c.active, sortOrder: c.sortOrder }); setOpen(true); }} />
              <DeleteIconButton onConfirm={() =>
                  catalogApi
                    .deleteCountry(c.code)
                    .then(() => {
                      toast.success("Country deleted.");
                      reload();
                    })
                    .catch(fail)
                } />
            </div>
          ))}</Paged>
        </div>
      </Card>
    </div>
  );
}
