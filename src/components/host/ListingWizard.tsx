import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Camera, Check, ChevronLeft, ChevronRight, DoorOpen, PartyPopper, RefreshCw, Ruler, Sparkles, Star, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { listingApi } from "@/api";
import { backendEnabled, remote } from "@/api/backend";
import { usePlatform } from "@/hooks/usePlatform";
import { EquipmentEditor } from "@/components/host/EquipmentEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { equipmentLabel, equipmentCatalogue } from "@/data/equipment";
import { categoryLabel } from "@/i18n/categories";
import { useClientCopy } from "@/i18n/clientCopy";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fill, useListingCopy } from "@/i18n/listingCopy";
import { cancellationLabel, cancellationText } from "@/lib/cancellation";
import { composeListingStory, highlightsBlock } from "@/lib/listingStory";
import { generateListingStory } from "@/lib/listingStory.functions";
import { cn } from "@/lib/utils";
import {
  MAX_PHOTOS,
  incompleteSteps,
  listingSteps,
  slugifyListing,
  validateStep,
  type ListingDraft,
  type ListingStep,
} from "@/models/listing";
import { amenityIds, propertyTypes, type AmenityId, type CancellationPolicy } from "@/models/property";

/**
 * One wizard for both adding and editing a listing. Every step writes into a
 * single `ListingDraft`, which is the JSON payload handed to `listingApi`.
 */
export function ListingWizard({
  initial,
  mode,
  onSaved,
}: {
  initial: ListingDraft;
  mode: "create" | "edit";
  onSaved: (draft: ListingDraft, published: boolean) => void;
}) {
  const c = useListingCopy();
  const cc = useClientCopy();
  const { locale } = useLanguage();
  const { currency, format, convertFromUsd, convertToUsd } = useCurrency();
  const { session } = usePlatform();

  const [draft, setDraft] = useState<ListingDraft>(initial);
  const [stepIndex, setStepIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ draft: ListingDraft; published: boolean; approved: boolean } | null>(null);
  // An identity document is required before a member can host for the first time.
  const [identityAsk, setIdentityAsk] = useState<{ publish: boolean } | null>(null);
  const [idKind, setIdKind] = useState<"passport" | "id_card" | "driving_licence" | "residence_permit">("passport");
  const [idNumber, setIdNumber] = useState("");
  const [identityFiled, setIdentityFiled] = useState(false);
  // Description step: free-form host notes + the wording the assistant returns.
  const [storyNotes, setStoryNotes] = useState("");
  const [writing, setWriting] = useState(false);
  const [highlights, setHighlights] = useState<string[]>([]);
  const writeStoryFn = useServerFn(generateListingStory);

  /** Builds the guest-facing wording from everything already entered. */
  async function writeStory() {
    if (draft.title.trim().length < 4 || draft.location.city.trim().length < 2) {
      toast.error(c.storyNeedFacts);
      return;
    }
    const facts = {
      title: draft.title.trim(),
      category: categoryLabel(draft.category, locale),
      city: draft.location.city.trim(),
      country: draft.location.country.trim(),
      neighbourhood: draft.location.neighbourhood.trim(),
      guests: draft.capacity.guests,
      rooms: draft.capacity.rooms,
      beds: draft.capacity.beds,
      baths: draft.capacity.baths,
      area: draft.capacity.area,
      amenities: draft.amenities.map((id) => amenityName(id as AmenityId, locale)),
      equipment: draft.equipment
        .map((id) => equipmentCatalogue.find((entry) => entry.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => equipmentLabel(item, locale)),
      nightly: format(draft.pricing.nightlyUsd),
      minNights: draft.pricing.minNights,
      checkIn: draft.policies.checkIn,
      checkOut: draft.policies.checkOut,
      instantBook: draft.policies.instantBook,
      cancellation: cancellationLabel(draft.policies.cancellationPolicy, cc),
      houseRules: draft.policies.houseRules.trim(),
      photoCount: draft.photos.length,
      locale,
      notes: storyNotes.trim(),
    };
    setWriting(true);
    try {
      const result = await writeStoryFn({
        data: { ...facts, ...(draft.photos[0] ? { coverPhoto: draft.photos[0] } : {}) },
      });
      patch({ summary: result.story.summary, description: result.story.description });
      setHighlights(result.story.highlights);
      toast.success(result.source === "model" ? c.storyDone : c.storyFallback);
    } catch {
      const local = composeListingStory(facts);
      patch({ summary: local.summary, description: local.description });
      setHighlights(local.highlights);
      toast.success(c.storyFallback);
    } finally {
      setWriting(false);
    }
  }


  const step = listingSteps[stepIndex] as ListingStep;
  const errors = useMemo(() => new Set(validateStep(step, draft)), [step, draft]);
  const missing = useMemo(() => incompleteSteps(draft), [draft]);
  const showError = (key: string) => touched && errors.has(key);

  const patch = (update: Partial<ListingDraft>) => setDraft((current) => ({ ...current, ...update }));
  const patchLocation = (update: Partial<ListingDraft["location"]>) =>
    setDraft((current) => ({ ...current, location: { ...current.location, ...update } }));
  const patchCapacity = (update: Partial<ListingDraft["capacity"]>) =>
    setDraft((current) => ({ ...current, capacity: { ...current.capacity, ...update } }));
  const patchPricing = (update: Partial<ListingDraft["pricing"]>) =>
    setDraft((current) => ({ ...current, pricing: { ...current.pricing, ...update } }));
  const patchPolicies = (update: Partial<ListingDraft["policies"]>) =>
    setDraft((current) => ({ ...current, policies: { ...current.policies, ...update } }));

  function goNext() {
    setTouched(true);
    if (errors.size > 0) {
      toast.error(c.required);
      return;
    }
    setTouched(false);
    setStepIndex((index) => Math.min(listingSteps.length - 1, index + 1));
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - draft.photos.length;
    Array.from(files)
      .slice(0, Math.max(0, room))
      .forEach((file) => {
        void shrinkImage(file).then((result) => {
          if (!result) return;
          setDraft((current) => ({
            ...current,
            photos: [...current.photos, result].slice(0, MAX_PHOTOS),
          }));
        });
      });
  }

  /** Swaps a single photo in place, keeping its position (and cover status). */
  function replacePhoto(index: number, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    void shrinkImage(file).then((result) => {
      if (!result) return;
      setDraft((current) => ({
        ...current,
        photos: current.photos.map((photo, i) => (i === index ? result : photo)),
      }));
      toast.success(c.photoReplaced);
    });
  }

  /** Moves a photo one slot earlier or later; slot 0 is the cover. */
  function movePhoto(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.photos.length) return current;
      const photos = [...current.photos];
      const moved = photos.splice(index, 1)[0];
      if (!moved) return current;
      photos.splice(target, 0, moved);
      return { ...current, photos };
    });
  }

  async function save(publish: boolean) {
    setTouched(true);
    if (missing.length > 0) {
      toast.error(c.reviewIncomplete);
      setStepIndex(listingSteps.indexOf(missing[0] as ListingStep));
      return;
    }
    // On create, turn the title into a readable address for the listing page.
    const suffix = draft.propertyId.split("-").pop() ?? "";
    const createdId = `${slugifyListing(draft.title) || "listing"}-${suffix}`;
    const payload: ListingDraft =
      mode === "create"
        ? {
            ...draft,
            propertyId: createdId,
            listingId: `hl-${createdId}`,
            status: publish ? "published" : "draft",
          }
        : { ...draft, status: publish ? "published" : "draft" };
    setSaving(true);
    try {
      // A member who has never hosted becomes a host on their first save,
      // otherwise the server refuses a listing they may not own.
      if (backendEnabled && session && session.role === "guest" && !identityFiled) {
        setIdentityAsk({ publish });
        setSaving(false);
        return;
      }
      const saved = await listingApi.saveListing(payload);
      toast.success(mode === "edit" ? c.updated : publish ? c.published : c.drafted);
      setSaved({ draft: saved.payload, published: publish, approved: saved.approved !== false });
      onSaved(saved.payload, publish);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : c.required);
    } finally {
      setSaving(false);
    }
  }

  /** Files the identity document, upgrades the account, then resumes the save. */
  async function submitIdentity() {
    if (idNumber.trim().length < 4) {
      toast.error(c.idMissing);
      return;
    }
    const pending = identityAsk;
    setSaving(true);
    try {
      const upgraded = await remote.becomeHost(session?.name, {
        documentKind: idKind,
        documentReference: idNumber.trim(),
      });
      if (!upgraded) return;
      setIdentityFiled(true);
      setIdentityAsk(null);
      setSaving(false);
      if (pending) await save(pending.publish);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : c.required);
    } finally {
      setSaving(false);
    }
  }

  const identityDialog = (
    <Dialog open={identityAsk !== null} onOpenChange={(open) => !open && setIdentityAsk(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{c.idTitle}</DialogTitle>
          <DialogDescription>{c.idIntro}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="identity-kind">{c.idKind}</Label>
            <select
              id="identity-kind"
              value={idKind}
              onChange={(e) => setIdKind(e.target.value as typeof idKind)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="passport">{c.idPassport}</option>
              <option value="id_card">{c.idCard}</option>
              <option value="driving_licence">{c.idLicence}</option>
              <option value="residence_permit">{c.idPermit}</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="identity-number">{c.idNumber}</Label>
            <Input
              id="identity-number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={c.idNumberPlaceholder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={saving} onClick={() => void submitIdentity()}>
            {c.idSubmit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const stepLabel = (key: ListingStep) => c.steps[key];

  if (saved) {
    const isDraft = !saved.published;
    const awaitingReview = !isDraft && saved.approved === false;
    const heading = isDraft
      ? c.successDraft
      : awaitingReview
        ? c.successPendingReview
        : mode === "edit"
          ? c.successUpdated
          : c.successPublished;
    const hint = fill(
      isDraft
        ? c.successDraftHint
        : awaitingReview
          ? c.successPendingReviewHint
          : mode === "edit"
            ? c.successUpdatedHint
            : c.successPublishedHint,
      { title: saved.draft.title },
    );
    return (
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-lift sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="size-8" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold sm:text-3xl">{heading}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left">
            {saved.draft.photos[0] ? (
              <img src={saved.draft.photos[0]} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate font-display font-semibold">{saved.draft.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {[saved.draft.location.city, saved.draft.location.country].filter(Boolean).join(", ")} ·{" "}
                {format(saved.draft.pricing.nightlyUsd)}
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-3 text-left text-sm">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{c.whatNext}</p>
            {[c.next1, c.next2, c.next3].map((line) => (
              <li key={line} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {saved.published ? (
              <Button asChild className="rounded-full">
                <Link to="/stays/$propertyId" params={{ propertyId: saved.draft.propertyId }}>
                  {c.viewListing}
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/host" search={{ section: "overview" }}>{c.backToDashboard}</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setSaved(null);
                setStepIndex(listingSteps.length - 1);
              }}
            >
              {c.keepEditing}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
      {identityDialog}
      <aside className="hidden lg:block">
        <ol className="space-y-1">
          {listingSteps.map((key, index) => {
            const done = !missing.includes(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={cn(
                    "grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg px-3 py-3 text-left text-sm",
                    index === stepIndex ? "bg-secondary font-semibold text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full border text-xs",
                      done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span>{stepLabel(key)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {fill(c.stepOf, { a: stepIndex + 1, b: listingSteps.length })}
          </p>
          <p className="font-display text-sm font-semibold">{stepLabel(step)}</p>
        </div>
        <ol className="mt-3 grid grid-cols-8 gap-1.5">
          {listingSteps.map((key, index) => (
            <li key={key}>
              <div className={cn("h-1.5 rounded-full transition-colors", index <= stepIndex ? "bg-primary" : "bg-border")} />
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          {missing.length === 0
            ? c.allSet
            : `${fill(c.progressDone, {
                n: Math.round(((listingSteps.length - 1 - missing.length) / (listingSteps.length - 1)) * 100),
              })} · ${fill(c.stepsLeft, { n: missing.length })}`}
        </p>

        <div key={step} className="mt-6 animate-fade-in rounded-lg border border-border bg-card p-5 shadow-lift sm:p-8">
          {step === "basics" ? (
            <div className="space-y-5">
              <Field label={c.title} error={showError("title")}>
                <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder={c.titlePh} maxLength={120} />
              </Field>
              <div>
                <Label className="mb-2 block">{c.category}</Label>
                <div className="flex flex-wrap gap-2">
                  {propertyTypes.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      onClick={() => patch({ category: value })}
                      className={cn(
                        "h-10 rounded-lg px-4 text-sm",
                        draft.category === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface hover:border-primary/50",
                      )}
                    >
                      {categoryLabel(value, locale)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === "story" ? (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">{c.storyHint}</p>
              <Field label={c.storyNotes}>
                <Textarea rows={2} value={storyNotes} onChange={(e) => setStoryNotes(e.target.value)} placeholder={c.storyNotesPh} maxLength={600} />
              </Field>
              <Button
                type="button"
                variant="outline"
                disabled={writing}
                onClick={() => void writeStory()}
                className="rounded-full"
              >
                <Sparkles className={cn("size-4", writing && "animate-pulse")} aria-hidden />
                {writing ? c.storyGenerating : draft.description.trim() ? c.storyRegenerate : c.storyGenerate}
              </Button>
              <Field label={c.summary} error={showError("summary")} hint={c.summaryHint}>
                <Textarea rows={3} value={draft.summary} onChange={(e) => patch({ summary: e.target.value })} placeholder={c.summaryPh} maxLength={300} />
              </Field>
              <Field label={c.description} error={showError("description")}>
                <Textarea rows={10} value={draft.description} onChange={(e) => patch({ description: e.target.value })} placeholder={c.descriptionPh} maxLength={4000} />
              </Field>
              {highlights.length > 0 ? (
                <div>
                  <Label className="mb-2 block">{c.storyHighlights}</Label>
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((item) => (
                      <Badge key={item} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-3 rounded-full px-3 text-sm"
                    onClick={() => {
                      const block = highlightsBlock(highlights, locale);
                      if (!block || draft.description.includes(block)) return;
                      patch({ description: `${draft.description.trim()}\n\n${block}`.slice(0, 4000) });
                    }}
                  >
                    {c.storyInsert}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "location" ? (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">{c.locationHint}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={c.city} error={showError("city")}>
                  <Input value={draft.location.city} onChange={(e) => patchLocation({ city: e.target.value })} placeholder={c.cityPh} />
                </Field>
                <Field label={c.country} error={showError("country")}>
                  <Input value={draft.location.country} onChange={(e) => patchLocation({ country: e.target.value })} placeholder={c.countryPh} />
                </Field>
                <Field label={c.postal}>
                  <Input value={draft.location.postal} onChange={(e) => patchLocation({ postal: e.target.value })} placeholder={c.postalPh} maxLength={16} />
                </Field>
                <Field label={c.neighbourhood}>
                  <Input value={draft.location.neighbourhood} onChange={(e) => patchLocation({ neighbourhood: e.target.value })} placeholder={c.neighbourhoodPh} />
                </Field>
              </div>
            </div>
          ) : null}

          {step === "space" ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Counter icon={<Users className="size-4" aria-hidden />} label={c.guests} value={draft.capacity.guests} onChange={(guests) => patchCapacity({ guests })} min={1} />
                <Counter icon={<DoorOpen className="size-4" aria-hidden />} label={c.rooms} value={draft.capacity.rooms} onChange={(rooms) => patchCapacity({ rooms })} min={1} />
                <Counter icon={<BedDouble className="size-4" aria-hidden />} label={c.beds} value={draft.capacity.beds} onChange={(beds) => patchCapacity({ beds })} min={1} />
                <Counter icon={<Bath className="size-4" aria-hidden />} label={c.baths} value={draft.capacity.baths} onChange={(baths) => patchCapacity({ baths })} min={1} />
                <Counter icon={<Ruler className="size-4" aria-hidden />} label={c.area} value={draft.capacity.area} onChange={(area) => patchCapacity({ area })} min={10} step={5} />
              </div>
              <div>
                <Label className="mb-2 block">{c.amenities}</Label>
                <div className="flex flex-wrap gap-2">
                  {amenityIds.map((id) => {
                    const active = draft.amenities.includes(id);
                    return (
                      <Button
                        key={id}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          patch({
                            amenities: (active
                              ? draft.amenities.filter((item) => item !== id)
                              : [...draft.amenities, id]) as AmenityId[],
                          })
                        }
                        className={cn(
                          "h-10 rounded-lg px-4 text-sm",
                          active ? "border-primary bg-accent text-accent-foreground" : "border-border bg-surface hover:border-primary/50",
                        )}
                      >
                        {active ? <Check className="size-3.5" aria-hidden /> : null}
                        {amenityName(id, locale)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step === "equipment" ? (
            <EquipmentEditor
              selected={draft.equipment}
              onChange={(equipment) => patch({ equipment })}
              idPrefix={`wizard-${draft.listingId || "new"}`}
            />
          ) : null}

          {step === "photos" ? (
            <div className="space-y-4">
              <div>
                <Label className="block">{c.photos}</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.photosHint} <span className="font-semibold tabular-nums">{draft.photos.length}/{MAX_PHOTOS}</span>
                </p>
              </div>
              <label
                className={cn(
                  "flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm",
                  showError("photos") ? "border-destructive text-destructive" : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
                  draft.photos.length >= MAX_PHOTOS && "pointer-events-none opacity-50",
                )}
              >
                <Camera className="size-6" aria-hidden />
                {c.addPhotos}
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
              </label>
              {draft.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {draft.photos.map((src, index) => (
                    <div key={`${src.slice(-24)}-${index}`} className="group relative overflow-hidden rounded-xl border border-border">
                      <img src={src} alt="" className="aspect-4/3 w-full object-cover" />
                      {index === 0 ? <Badge className="absolute top-2 left-2">{c.cover}</Badge> : null}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {index > 0 ? (
                          <button
                            type="button"
                            aria-label={c.makeCover}
                            title={c.makeCover}
                            onClick={() => {
                              patch({ photos: [src, ...draft.photos.filter((_, i) => i !== index)] });
                              toast.success(c.coverUpdated);
                            }}
                            className="grid size-8 place-items-center rounded-full bg-background/85 text-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <Star className="size-4" aria-hidden />
                          </button>
                        ) : null}
                        <label
                          aria-label={c.replacePhoto}
                          title={c.replacePhoto}
                          className="grid size-8 cursor-pointer place-items-center rounded-full bg-background/85 text-foreground hover:bg-primary hover:text-primary-foreground"
                        >
                          <RefreshCw className="size-4" aria-hidden />
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => replacePhoto(index, e.target.files)}
                          />
                        </label>
                        <button
                          type="button"
                          aria-label={c.removePhoto}
                          title={c.removePhoto}
                          onClick={() => patch({ photos: draft.photos.filter((_, i) => i !== index) })}
                          className="grid size-8 place-items-center rounded-full bg-background/85 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {index > 0 ? (
                          <button
                            type="button"
                            aria-label={c.moveLeft}
                            title={c.moveLeft}
                            onClick={() => movePhoto(index, -1)}
                            className="grid size-8 place-items-center rounded-full bg-background/85 text-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <ChevronLeft className="size-4" aria-hidden />
                          </button>
                        ) : null}
                        {index < draft.photos.length - 1 ? (
                          <button
                            type="button"
                            aria-label={c.moveRight}
                            title={c.moveRight}
                            onClick={() => movePhoto(index, 1)}
                            className="grid size-8 place-items-center rounded-full bg-background/85 text-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            <ChevronRight className="size-4" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "pricing" ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${c.price} (${currency})`} error={showError("nightlyUsd")}>
                  <Input
                    type="number"
                    min={1}
                    value={Math.round(convertFromUsd(draft.pricing.nightlyUsd))}
                    onChange={(e) => patchPricing({ nightlyUsd: convertToUsd(Number(e.target.value) || 0) })}
                  />
                </Field>
                <Field label={`${c.cleaningFee} (${currency})`}>
                  <Input
                    type="number"
                    min={0}
                    value={Math.round(convertFromUsd(draft.pricing.cleaningFeeUsd))}
                    onChange={(e) => patchPricing({ cleaningFeeUsd: convertToUsd(Number(e.target.value) || 0) })}
                  />
                </Field>
                <Field label={c.minNights} error={showError("minNights")}>
                  <Input
                    type="number"
                    min={1}
                    value={draft.pricing.minNights}
                    onChange={(e) => patchPricing({ minNights: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={c.checkIn} error={showError("checkIn")}>
                    <Input type="time" value={draft.policies.checkIn} onChange={(e) => patchPolicies({ checkIn: e.target.value })} />
                  </Field>
                  <Field label={c.checkOut} error={showError("checkOut")}>
                    <Input type="time" value={draft.policies.checkOut} onChange={(e) => patchPolicies({ checkOut: e.target.value })} />
                  </Field>
                </div>
              </div>

              <p className="rounded-xl bg-sky-panel px-4 py-3 text-sm">
                {c.earnings}: <strong>{format(Math.round(draft.pricing.nightlyUsd * 30 * 0.7))}</strong>
              </p>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <Label className="text-sm">{c.instantBook}</Label>
                  <p className="text-xs text-muted-foreground">{c.instantBookHint}</p>
                </div>
                <Switch checked={draft.policies.instantBook} onCheckedChange={(instantBook) => patchPolicies({ instantBook })} />
              </div>

              <div>
                <h3 className="font-display text-base font-bold">{c.derivedRates}</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm">{c.longStay}</Label>
                      <Switch
                        checked={draft.pricing.longStay.enabled}
                        onCheckedChange={(enabled) => patchPricing({ longStay: { ...draft.pricing.longStay, enabled } })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={c.nightsThreshold}>
                        <Input
                          type="number"
                          min={1}
                          value={draft.pricing.longStay.threshold}
                          onChange={(e) =>
                            patchPricing({ longStay: { ...draft.pricing.longStay, threshold: Math.max(1, Number(e.target.value) || 1) } })
                          }
                        />
                      </Field>
                      <Field label={c.discountPercent}>
                        <Input
                          type="number"
                          min={0}
                          max={90}
                          value={draft.pricing.longStay.discount}
                          onChange={(e) =>
                            patchPricing({ longStay: { ...draft.pricing.longStay, discount: Number(e.target.value) || 0 } })
                          }
                        />
                      </Field>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm">{c.mobileDiscount}</Label>
                      <Switch
                        checked={draft.pricing.mobile.enabled}
                        onCheckedChange={(enabled) => patchPricing({ mobile: { ...draft.pricing.mobile, enabled } })}
                      />
                    </div>
                    <Field label={c.discountPercent}>
                      <Input
                        type="number"
                        min={0}
                        max={90}
                        value={draft.pricing.mobile.discount}
                        onChange={(e) => patchPricing({ mobile: { ...draft.pricing.mobile, discount: Number(e.target.value) || 0 } })}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <Field label={c.rules}>
                <Textarea rows={3} value={draft.policies.houseRules} onChange={(e) => patchPolicies({ houseRules: e.target.value })} placeholder={c.rulesPh} />
              </Field>

              <div>
                <h3 className="font-display text-base font-bold">{c.cancellation}</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(["flexible", "moderate", "strict"] as CancellationPolicy[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => patchPolicies({ cancellationPolicy: value })}
                      aria-pressed={draft.policies.cancellationPolicy === value}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        draft.policies.cancellationPolicy === value ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40",
                      )}
                    >
                      <span className="text-sm font-semibold">{cancellationLabel(value, cc)}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{cancellationText(value, cc)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold">{c.review}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.reviewHint}</p>
              </div>

              <ul className="divide-y divide-border rounded-xl border border-border">
                {listingSteps
                  .filter((key) => key !== "review")
                  .map((key) => {
                    const done = !missing.includes(key);
                    return (
                      <li key={key} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "grid size-5 place-items-center rounded-full text-[10px]",
                              done ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {done ? <Check className="size-3" aria-hidden /> : "!"}
                          </span>
                          {stepLabel(key)}
                        </span>
                        {done ? (
                          <span className="text-xs text-muted-foreground">{c.complete}</span>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setStepIndex(listingSteps.indexOf(key))}>
                            {c.goToStep}
                          </Button>
                        )}
                      </li>
                    );
                  })}
              </ul>

              <div className="rounded-xl border border-border p-4">
                <div className="flex gap-4">
                  {draft.photos[0] ? <img src={draft.photos[0]} alt="" className="size-24 shrink-0 rounded-lg object-cover" /> : null}
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="truncate font-display text-base font-semibold">{draft.title || c.notSet}</p>
                    <p className="text-muted-foreground">
                      {[draft.location.city, draft.location.country].filter(Boolean).join(", ") || c.notSet}
                      {draft.location.postal ? ` · ${draft.location.postal}` : ""} · {categoryLabel(draft.category, locale)}
                    </p>
                    <p className="text-muted-foreground">
                      {draft.capacity.guests} {c.guests} · {draft.capacity.rooms} {c.rooms} · {draft.capacity.beds} {c.beds} ·{" "}
                      {draft.capacity.baths} {c.baths} · {draft.capacity.area} m²
                    </p>
                    <p className="text-muted-foreground">
                      {format(draft.pricing.nightlyUsd)} · {fill(c.minNightsValue, { n: draft.pricing.minNights })} ·{" "}
                      {cancellationLabel(draft.policies.cancellationPolicy, cc)}
                    </p>
                    <p className="text-muted-foreground">
                      {fill(c.equipmentCount, { n: draft.equipment.length })} · {fill(c.photoCount, { n: draft.photos.length })}
                    </p>
                  </div>
                </div>
                {draft.equipment.length ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {draft.equipment.slice(0, 12).map((id) => {
                      const item = equipmentCatalogue.find((entry) => entry.id === id);
                      return item ? (
                        <Badge key={id} variant="secondary" className="rounded-full font-normal">
                          {equipmentLabel(item, locale)}
                        </Badge>
                      ) : null;
                    })}
                    {draft.equipment.length > 12 ? (
                      <Badge variant="secondary" className="rounded-full font-normal">
                        +{draft.equipment.length - 12}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>

            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <Button type="button" variant="ghost" className="rounded-full" disabled={stepIndex === 0} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
              <ArrowLeft className="size-4" aria-hidden />
              {c.back}
            </Button>
            <div className="flex gap-2">
              {step === "review" ? (
                <>
                  <Button type="button" variant="outline" className="rounded-full" disabled={saving} onClick={() => void save(false)}>
                    {saving ? c.saving : c.saveDraft}
                  </Button>
                  <Button type="button" className="rounded-full" disabled={saving} onClick={() => void save(true)}>
                    {saving ? c.saving : mode === "edit" ? c.saveChanges : c.publish}
                  </Button>
                </>
              ) : (
                <Button type="button" className="rounded-full" onClick={goNext}>
                  {c.next}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const amenityNames: Record<string, Record<AmenityId, string>> = {
  en: {
    wifi: "Wi-Fi",
    pool: "Pool",
    kitchen: "Kitchen",
    parking: "Parking",
    airConditioning: "Air conditioning",
    workspace: "Workspace",
    petFriendly: "Pets allowed",
    breakfast: "Breakfast",
  },
  fr: {
    wifi: "Wi-Fi",
    pool: "Piscine",
    kitchen: "Cuisine",
    parking: "Parking",
    airConditioning: "Climatisation",
    workspace: "Espace de travail",
    petFriendly: "Animaux acceptés",
    breakfast: "Petit-déjeuner",
  },
};

function amenityName(id: AmenityId, locale: string) {
  return (amenityNames[locale] ?? amenityNames["en"]!)[id];
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(error && "[&_input]:border-destructive [&_textarea]:border-destructive")}>
      <Label className="mb-2 block">{label}</Label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Counter({
  icon,
  label,
  value,
  onChange,
  min = 0,
  step = 1,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <span className="flex items-center gap-2 text-sm">
        {icon}
        {label}
      </span>
      <span className="flex items-center gap-3">
        <Button type="button" size="icon" variant="outline" className="size-8 rounded-full" aria-label={`− ${label}`} onClick={() => onChange(Math.max(min, value - step))}>
          −
        </Button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums">{value}</span>
        <Button type="button" size="icon" variant="outline" className="size-8 rounded-full" aria-label={`+ ${label}`} onClick={() => onChange(value + step)}>
          +
        </Button>
      </span>
    </div>
  );
}

/**
 * Photos are stored inline with the listing, so a straight camera file would
 * make the payload huge. Scale the longest side down and re-encode as JPEG.
 */
async function shrinkImage(file: File, maxSide = 1600, quality = 0.82): Promise<string | null> {
  const readAsDataUrl = () =>
    new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

  const source = await readAsDataUrl();
  if (!source) return null;
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = source;
    });
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return source;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encoded = canvas.toDataURL("image/jpeg", quality);
    return encoded.length < source.length ? encoded : source;
  } catch {
    return source;
  }
}
