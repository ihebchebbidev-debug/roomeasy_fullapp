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

/* ------------------------------------------------------------------ amenities */

export function AmenitiesPanel() {
  const [search, setSearch] = useState("");
  const { data, loading, reload } = useLoad(() => catalogApi.amenities(), { items: [] as AmenityDto[], groups: [] as string[] });
  const [draft, setDraft] = useState({ id: "", group: "", labelEn: "", labelFr: "", paid: false, active: true });
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
    if (!window.confirm("Remove this amenity? If listings use it, it will be retired instead.")) return;
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
      <Card title="Add or update an amenity">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const { id, ...body } = draft;
            if (await save(id.trim().toLowerCase(), body))
              setDraft({ id: "", group: draft.group, labelEn: "", labelFr: "", paid: false, active: true });
          }}
        >
          <div className="space-y-1">
            <Label>Code</Label>
            <Input required pattern="[a-z0-9_-]{2,80}" placeholder="e.g. sauna" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
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
          <div className="space-y-1">
            <Label>Label (English)</Label>
            <Input required value={draft.labelEn} onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Label (French)</Label>
            <Input required value={draft.labelFr} onChange={(e) => setDraft({ ...draft, labelFr: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={draft.paid} onCheckedChange={(paid) => setDraft({ ...draft, paid })} /> Paid extra
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={busy}>Save amenity</Button>
          </div>
        </form>
      </Card>

      <Card title={`Amenities (${data.items.length})`} action={<Input className="w-56" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />}>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div className="divide-y divide-border">
          {items.map((item) => (
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
                    save(item.id, { group: item.group, labelEn: item.label.en, labelFr: item.label.fr, paid: item.paid, active })
                  }
                />
                {item.active ? "Active" : "Hidden"}
              </label>
              <Button size="sm" variant="ghost" onClick={() => setDraft({ id: item.id, group: item.group, labelEn: item.label.en, labelFr: item.label.fr, paid: item.paid, active: item.active })}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(item.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------------------------------------------- cities */

const emptyCity: CityInput = { name: "", country: "", active: true, featured: false, sortOrder: 0 };

export function CitiesPanel() {
  const { data, loading, reload } = useLoad(() => catalogApi.cities(), [] as CityDto[]);
  const [draft, setDraft] = useState<CityInput & { id?: string }>(emptyCity);

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
      <Card
        title={draft.id ? "Edit city" : "Add a city"}
        action={
          <Button variant="outline" size="sm" onClick={() => run(async () => toast.info(`${(await catalogApi.importCities()).added} cities imported.`), "Import finished.")}>
            Import cities from listings
          </Button>
        }
      >
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            const { id, ...body } = draft;
            run(() => (id ? catalogApi.updateCity(id, body) : catalogApi.createCity(body)), "City saved.").then(() => setDraft(emptyCity));
          }}
        >
          <div className="space-y-1">
            <Label>City</Label>
            <Input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Country</Label>
            <Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
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
          <div className="flex gap-2">
            <Button type="submit">{draft.id ? "Update city" : "Add city"}</Button>
            {draft.id ? (
              <Button type="button" variant="ghost" onClick={() => setDraft(emptyCity)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title={`Cities (${data.length})`}>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {!loading && data.length === 0 ? <p className="text-sm text-muted-foreground">No cities yet.</p> : null}
        <div className="divide-y divide-border">
          {data.map((city) => (
            <div key={city.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className="min-w-40 flex-1 font-medium">
                {city.name} <span className="font-normal text-muted-foreground">{city.country}</span>
              </span>
              <span className="text-xs text-muted-foreground">{city.listings} listings</span>
              {city.featured ? <Badge>Featured</Badge> : null}
              {!city.active ? <Badge variant="outline">Hidden</Badge> : null}
              <Button size="sm" variant="ghost" onClick={() => setDraft({ id: city.id, name: city.name, country: city.country, active: city.active, featured: city.featured, sortOrder: city.sortOrder })}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => window.confirm(`Delete ${city.name}?`) && run(() => catalogApi.deleteCity(city.id), "City deleted.")}
              >
                Delete
              </Button>
            </div>
          ))}
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
    if (!window.confirm("Delete this version? The public page will fall back to English or the built-in text.")) return;
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
        Start a line with "## " to make a heading; leave a blank line between paragraphs.
      </p>
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Content</Label>
        <Textarea rows={16} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={form.published} onCheckedChange={(published) => setForm({ ...form, published })} /> Published
        </label>
        <Button onClick={save} disabled={!form.title.trim()}>Save page</Button>
        {existing ? (
          <Button variant="ghost" className="text-destructive" onClick={remove}>
            Delete this version
          </Button>
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
        {rows.map((row) => (
          <div key={row.key} className="flex flex-wrap items-center gap-3 py-2 text-sm">
            <code className="w-64 truncate text-xs text-muted-foreground">{row.key}</code>
            <span className="min-w-40 flex-1">{row.value}</span>
            <Button size="sm" variant="ghost" onClick={() => setDraft({ key: row.key, value: row.value })}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() =>
                catalogApi
                  .deleteTranslation(locale, row.key)
                  .then(() => {
                    toast.success("Custom text removed.");
                    reload();
                  })
                  .catch(fail)
              }
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- property types */

const emptyType = { id: "", labels: { en: "", fr: "", es: "", de: "", pt: "" }, active: true, sortOrder: 0 };

export function PropertyTypesPanel() {
  const { data, loading, reload } = useLoad(() => catalogApi.propertyTypes(), [] as PropertyTypeAdminDto[]);
  const [draft, setDraft] = useState(emptyType);
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
      <Card title={editing ? `Edit "${draft.id}"` : "Add a property type"}>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const { id, ...body } = draft;
            if (await save(id.trim().toLowerCase(), body)) setDraft(emptyType);
          }}
        >
          <div className="space-y-1">
            <Label>Code</Label>
            <Input required disabled={editing} pattern="[a-z0-9_-]{2,40}" placeholder="e.g. houseboat" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
          </div>
          {LOCALES.map((l) => (
            <div key={l} className="space-y-1">
              <Label>Name ({l.toUpperCase()}){l === "en" ? " *" : ""}</Label>
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
          <div className="flex items-end gap-2">
            <Button type="submit">{editing ? "Update" : "Add type"}</Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={() => setDraft(emptyType)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        <p className="text-xs text-muted-foreground">The code can't be changed later. Empty names fall back to English.</p>
      </Card>

      <Card title={`Property types (${data.length})`}>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div className="divide-y divide-border">
          {data.map((type) => (
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
              <Button size="sm" variant="ghost" onClick={() => setDraft({ id: type.id, labels: type.labels, active: type.active, sortOrder: type.sortOrder })}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={async () => {
                  if (!window.confirm("Remove this type? If listings use it, it will be hidden instead.")) return;
                  try {
                    const r = await catalogApi.removePropertyType(type.id);
                    toast.success(r.deleted ? "Type removed." : "Type in use — hidden instead.");
                    reload();
                  } catch (error) {
                    fail(error);
                  }
                }}
              >
                Remove
              </Button>
            </div>
          ))}
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
      <Card title={editing ? `Edit ${draft.code.toUpperCase()}` : "Add a country"}>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const { code, ...body } = draft;
            if (await save(code.trim().toUpperCase(), body)) setDraft(emptyCountry);
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
          <div className="flex items-end gap-2">
            <Button type="submit">{editing ? "Update" : "Add country"}</Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={() => setDraft(emptyCountry)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        <p className="text-xs text-muted-foreground">
          Hosts can only pick active countries. Other languages show the country name automatically from its code.
        </p>
      </Card>

      <Card title={`Countries (${data.length})`} action={<Input className="w-56" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />}>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div className="divide-y divide-border">
          {rows.map((c) => (
            <div key={c.code} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <code className="w-10 text-xs text-muted-foreground">{c.code}</code>
              <span className="min-w-40 flex-1">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.listings} listings</span>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={c.active} onCheckedChange={(active) => save(c.code, { name: c.name, active, sortOrder: c.sortOrder })} />
                {c.active ? "Active" : "Hidden"}
              </label>
              <Button size="sm" variant="ghost" onClick={() => setDraft({ code: c.code, name: c.name, active: c.active, sortOrder: c.sortOrder })}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() =>
                  window.confirm(`Delete ${c.name}? Existing listings keep their country.`) &&
                  catalogApi
                    .deleteCountry(c.code)
                    .then(() => {
                      toast.success("Country deleted.");
                      reload();
                    })
                    .catch(fail)
                }
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
