import { Link, createFileRoute } from "@tanstack/react-router";
import { canonical, KEYWORDS, publicPageMeta } from "@/lib/seo";
import { useMemo } from "react";

import { ListingWizard } from "@/components/host/ListingWizard";
import { Button } from "@/components/ui/button";
import { AccountShell } from "@/components/layout/AccountShell";
import { useAllProperties } from "@/hooks/useAllProperties";
import { usePlatform } from "@/hooks/usePlatform";
import { useListingCopy } from "@/i18n/listingCopy";
import {
  draftFromProperty,
  emptyListingDraft,
  slugifyListing,
  type ListingDraft,
} from "@/models/listing";

export const Route = createFileRoute("/list-your-place")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } =>
    typeof search["edit"] === "string" ? { edit: search["edit"] } : {},
  head: () => ({
    meta: publicPageMeta({
      title: "Mettre son logement en location — devenir hôte RoomEasy",
      description:
        "Publiez votre appartement, villa, chalet ou maison d'hôtes en sept étapes guidées : informations, adresse, espaces, équipements, photos, tarifs et mise en ligne.",
      path: "/list-your-place",
      keywords: KEYWORDS.host,
    }),
    links: canonical("/list-your-place"),
  }),
  component: ListYourPlacePage,
});

function ListYourPlacePage() {
  const { edit } = Route.useSearch();
  
  const c = useListingCopy();
  const properties = useAllProperties();
  const { listings, session } = usePlatform();

  const property = edit ? properties.find((item) => item.id === edit) : undefined;
  const listing = property ? listings.find((item) => item.propertyId === property.id) : undefined;
  const mode: "create" | "edit" = property ? "edit" : "create";

  const initial: ListingDraft = useMemo(() => {
    if (property) return draftFromProperty(property, listing);
    const base = emptyListingDraft();
    const id = `${slugifyListing("new-listing")}-${Math.random().toString(36).slice(2, 6)}`;
    return { ...base, propertyId: id, listingId: `hl-${id}` };
    // A fresh id is generated once per wizard session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id, listing?.id]);

  // The wizard shows its own success screen; navigation happens from there.
  function onSaved(_draft: ListingDraft, _published: boolean) {}

  // A listing always belongs to an account, so ask for sign-in before any work is lost.
  if (!session) {
    return (
      <AccountShell>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{c.signInRequired}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{c.signInRequiredHint}</p>
          <Button asChild className="mt-6">
            <Link to="/auth">
              {c.signInRequired}
            </Link>
          </Button>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            {mode === "edit" ? c.editTitle : c.createTitle}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "edit" ? c.editSubtitle : c.createSubtitle}
          </p>
        </div>
        <ListingWizard key={initial.propertyId} initial={initial} mode={mode} onSaved={onSaved} />
      </div>
    </AccountShell>
  );
}
