import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { catalogApi } from "@/api/http/catalog.http";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { adminApi, type AdminHostProfileDto } from "@/api/http/platform.http";
import { backendEnabled } from "@/api/backend";
import { privatePageMeta } from "@/lib/seo";

export const Route = createFileRoute("/admin_/hosts/$userId")({
  head: () => ({
    meta: privatePageMeta(
      "Host profile — RoomEasy back office",
      "Everything about one host: listings, bookings, revenue, reviews and documents.",
    ),
  }),
  component: AdminHostProfile,
});

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-surface p-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function AdminHostProfile() {
  const { userId } = Route.useParams();
  const [data, setData] = useState<AdminHostProfileDto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    void adminApi
      .hostProfile(userId)
      .then((dto) => {
        if (active) setData(dto);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="size-4" aria-hidden />
              Back office
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6 sm:px-6 lg:px-8">
        {error ? (
          <EmptyState title="This host could not be loaded." />
        ) : !data ? (
          <EmptyState title="Loading host profile…" />
        ) : (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold">{data.host.displayName || data.host.fullName}</h1>
              <p className="text-sm text-muted-foreground">
                {data.host.email}
                {data.host.phone ? ` · ${data.host.phone}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {data.host.superhost ? <Badge variant="secondary">Superhost</Badge> : null}
                <Badge variant="secondary" className="capitalize">
                  ID {data.host.verificationStatus}
                </Badge>
                {data.host.hostingSince ? <Badge variant="secondary">Hosting since {data.host.hostingSince}</Badge> : null}
                <Badge variant="secondary">
                  Commission {Math.round((data.host.commissionRate ?? data.host.defaultCommissionRate) * 100)}%
                </Badge>
                {data.host.banned ? (
                  <Badge className="border-0 bg-destructive/10 text-destructive">
                    Banned{data.host.bannedReason ? ` · ${data.host.bannedReason}` : ""}
                  </Badge>
                ) : null}
                {data.host.suspended ? (
                  <Badge className="border-0 bg-destructive/10 text-destructive">
                    Suspended{data.host.suspendedUntil ? ` until ${new Date(data.host.suspendedUntil).toLocaleDateString()}` : ""}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                  onClick={() =>
                    catalogApi
                      .syncIdentity(userId)
                      .then((r) => toast.success(`Stripe identity: ${r.stripeStatus}${r.requirements.length ? ` (${r.requirements.length} items due)` : ""}`))
                      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Could not reach Stripe."))
                  }
                >
                  Refresh identity from Stripe
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                  onClick={() =>
                    window.confirm("Turn off this member's two-step sign-in? They will sign in with password only until they set it up again.") &&
                    catalogApi
                      .resetTwoFactor(userId)
                      .then(() => toast.success("Two-step sign-in reset."))
                      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Reset failed."))
                  }
                >
                  Reset two-step sign-in
                </button>
              </div>
            </header>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Listings" value={`${data.totals.publishedListings}/${data.totals.listings} live`} />
              <Stat label="Bookings" value={data.totals.bookings} />
              <Stat label="Gross revenue" value={money(data.totals.grossRevenueUsd)} />
              <Stat label="Commission" value={money(data.totals.commissionUsd)} />
              <Stat label="Completed" value={data.totals.completedBookings} />
              <Stat label="Cancelled" value={data.totals.cancelledBookings} />
              <Stat label="Average rating" value={data.totals.averageRating ? data.totals.averageRating.toFixed(2) : "—"} />
              <Stat label="Reviews" value={data.totals.reviews} />
            </div>

            <Section title="Listings">
              {data.listings.length === 0 ? (
                <EmptyState title="No listings yet." size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  {data.listings.map((listing) => (
                    <li key={listing.listingId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <Link
                          to="/admin/listings/$listingId"
                          params={{ listingId: listing.listingId }}
                          className="font-medium hover:underline"
                        >
                          {listing.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {listing.city}, {listing.country} · {money(listing.nightlyUsd)}/night
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{listing.status}</Badge>
                        {listing.approved ? null : <Badge variant="outline">Awaiting review</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Bookings">
              {data.bookings.length === 0 ? (
                <EmptyState title="No bookings yet." size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  {data.bookings.map((booking) => (
                    <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {booking.reference} · {booking.propertyName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.guestName} · {booking.checkIn} → {booking.checkOut}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                        <span className="text-sm font-medium">{money(booking.totalUsd)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Reviews">
              {data.reviews.length === 0 ? (
                <EmptyState title="No reviews yet." size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  {data.reviews.map((review) => (
                    <li key={review.id} className="space-y-1 p-4">
                      <p className="text-sm font-medium">
                        {review.rating.toFixed(1)} · {review.propertyName}
                        <span className="ml-2 font-normal text-muted-foreground">{review.authorName}</span>
                        {review.hidden ? <Badge className="ml-2" variant="outline">Hidden</Badge> : null}
                      </p>
                      <p className="text-sm text-muted-foreground">{review.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Documents">
              {data.documents.length === 0 ? (
                <EmptyState title="No identity documents submitted." size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  {data.documents.map((doc) => (
                    <li key={doc.id} className="flex flex-col gap-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">{doc.documentKind ?? "Document"}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.documentReference ?? "—"} · submitted {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize">{doc.status}</Badge>
                      </div>
                      {doc.documentFiles && doc.documentFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {doc.documentFiles.map((file, i) => (
                            <a key={i} href={file} target="_blank" rel="noreferrer" className="block max-w-[200px]">
                              <img src={file} alt="Identity document" className="rounded-lg object-contain bg-muted" />
                            </a>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}
      </div>
    </main>
  );
}
