import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { canonical, localeOf, KEYWORDS, publicPageMeta } from "@/lib/seo";
import { useEffect, useMemo } from "react";

import { ListingWizard } from "@/components/host/ListingWizard";
import { AccountShell } from "@/components/layout/AccountShell";
import { useAllProperties } from "@/hooks/useAllProperties";
import { getPlatform, usePlatform } from "@/hooks/usePlatform";
import { useListingCopy } from "@/i18n/listingCopy";
import { pageMeta } from "@/i18n/pageMeta";
import {
  draftFromProperty,
  emptyListingDraft,
  slugifyListing,
  type ListingDraft,
} from "@/models/listing";

export const Route = createFileRoute("/list-your-place")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } =>
    typeof search["edit"] === "string" ? { edit: search["edit"] } : {},
  head: ({ match }) => ({
    meta: publicPageMeta({
      locale: localeOf(match),
      ...pageMeta.host[localeOf(match) ?? "en"],
      path: "/list-your-place",
      keywords: KEYWORDS[localeOf(match) ?? "en"].host,
    }),
    links: canonical("/list-your-place", localeOf(match)),
  }),
  component: ListYourPlacePage,
});

function ListYourPlacePage() {
  const { edit } = Route.useSearch();
  const navigate = useNavigate();
  const href = useLocation({ select: (location) => location.href });
  
  const c = useListingCopy();
  const properties = useAllProperties();
  const { listings, session } = usePlatform();
  useEffect(() => {
    if (href.split("?")[0]?.endsWith("/list-your-place") && !session && !getPlatform().session) void navigate({ to: "/auth", search: { redirect: href }, replace: true });
  }, [session, navigate, href]);

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

  // Keep the public entry outside the private shell until signed in.
  if (!session) return null;

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
