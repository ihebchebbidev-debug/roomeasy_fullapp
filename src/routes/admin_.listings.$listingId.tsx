import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Check, RotateCcw, ShieldOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ListingPreview } from "@/components/admin/ListingPreview";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RejectListingDialog } from "@/components/admin/RejectListingDialog";
import { adminApi } from "@/api/http/platform.http";
import { propertiesApi } from "@/api/http/platform.http";
import { backendEnabled, toProperty } from "@/api/backend";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Property } from "@/models/property";
import { privatePageMeta } from "@/lib/seo";

export const Route = createFileRoute("/admin_/listings/$listingId")({
  head: () => ({
    meta: privatePageMeta(
      "Listing review — RoomEasy back office",
      "Full listing preview for moderators, with approval controls.",
    ),
  }),
  component: AdminListingDetail,
});

function AdminListingDetail() {
  const { listingId } = Route.useParams();
  const { t } = useLanguage();
  const { listings, accountDataStatus } = usePlatform();
  const allProperties = useAllProperties();
  const listing = listings.find((item) => item.id === listingId);
  const [property, setProperty] = useState<Property | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const propertyId = listing?.propertyId;
  const known = allProperties.find((item) => item.id === propertyId);

  // Listings awaiting approval are missing from the public catalogue, so the
  // back office loads the full record straight from the API.
  useEffect(() => {
    if (known) {
      setProperty(known);
      return;
    }
    if (!backendEnabled || !propertyId) return;
    let active = true;
    void propertiesApi
      .get(propertyId)
      .then((dto) => {
        if (active) setProperty(toProperty(dto));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [known, propertyId]);

  const act = async (
    run: () => Promise<unknown>,
    patch: { approved?: boolean; status?: "draft" | "published" | "suspended" },
    message: string,
  ) => {
    setBusy(true);
    try {
      await run();
      setPlatform((s) => ({
        listings: s.listings.map((l) => (l.id === listingId ? { ...l, ...patch } : l)),
      }));
      toast.success(message);
    } catch {
      toast.error("The action could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="justify-self-start">
            <Link to="/admin">
              <ArrowLeft className="size-4" aria-hidden />
              {t.app.admin.title}
            </Link>
          </Button>


        {listing ? (
          <div className="flex flex-wrap gap-2">
            {listing.approved ? null : (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  act(
                    () => adminApi.approveListing(listing.id),
                    { approved: true, status: "published" },
                    t.app.admin.approved,
                  )
                }
              >
                <Check className="size-4" aria-hidden />
                {t.app.admin.approve}
              </Button>
            )}
            {/* Suspend only while the stay is live; reinstate only while suspended. */}
            {listing.approved && listing.status === "published" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  act(
                    () => adminApi.suspendListing(listing.id),
                    { status: "suspended" },
                    t.app.admin.listingSuspended,
                  )
                }
              >
                <ShieldOff className="size-4" aria-hidden />
                {t.app.admin.suspend}
              </Button>
            ) : null}
            {listing.status === "suspended" ? (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  act(
                    () => adminApi.restoreListing(listing.id),
                    { approved: true, status: "published" },
                    t.app.admin.reinstated,
                  )
                }
              >
                <RotateCcw className="size-4" aria-hidden />
                {t.app.admin.reinstate}
              </Button>
            ) : null}
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejectOpen(true)}>
              <X className="size-4" aria-hidden />
              {t.app.admin.reject}
            </Button>
            <RejectListingDialog
              open={rejectOpen}
              onOpenChange={setRejectOpen}
              listingName={property?.name}
              onConfirm={(code, details) =>
                act(() => adminApi.rejectListing(listing.id, code, details), { status: "suspended" }, t.app.admin.rejected)
              }
            />
          </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        {listing && property ? (
          <ListingPreview listing={listing} property={property} />
        ) : accountDataStatus === "ready" && !listing ? (
          <EmptyState title="This listing could not be found." />
        ) : (
          <EmptyState title={t.app.common.loading} />
        )}
      </div>
    </main>
  );
}
