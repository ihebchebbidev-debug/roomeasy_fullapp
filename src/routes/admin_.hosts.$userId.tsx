import { Paged, rowText } from "@/components/admin/ListControls";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { catalogApi } from "@/api/http/catalog.http";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { adminApi, type AdminHostProfileDto } from "@/api/http/platform.http";
import { adminOpsApi } from "@/api/http/adminOps.http";
import { UserAvatar } from "@/components/ui/user-avatar";
import { IdentityBadge } from "@/components/admin/IdentityBadge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import { backendEnabled } from "@/api/backend";
import { privatePageMeta } from "@/lib/seo";
import { useAdminT } from "@/i18n/adminAutoCopy";
import { useCurrency } from "@/i18n/CurrencyProvider";

export const Route = createFileRoute("/admin_/hosts/$userId")({
  head: () => ({
    meta: privatePageMeta(
      "Member details — RoomEasy back office",
      "Everything about one member: identity proof, listings, bookings, trips and reviews.",
    ),
  }),
  component: AdminHostProfile,
});

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
  const T = useAdminT();
  const { format: money } = useCurrency();
  const [data, setData] = useState<AdminHostProfileDto | null>(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [notes, setNotes] = useState("");
  const [deciding, setDeciding] = useState(false);

  async function decide(status: "verified" | "rejected") {
    if (status === "rejected" && notes.trim().length < 3) {
      toast.error(T("Write the reason for refusing — the member receives it by email."));
      return;
    }
    setDeciding(true);
    try {
      await adminOpsApi.setVerification(userId, status, notes.trim() || undefined);
      toast.success(status === "verified" ? T("Identity validated.") : T("Identity refused."));
      setNotes("");
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : T("Could not save the decision."));
    } finally {
      setDeciding(false);
    }
  }

  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    setError(false);
    setData(null);
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
  }, [userId, version]);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="size-4" aria-hidden />
              {T("Back office")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6 sm:px-6 lg:px-8">
        {error ? (
          <EmptyState title={T("This member could not be loaded.")} action={<Button onClick={() => setVersion((value) => value + 1)}>{T("Try again")}</Button>} />
        ) : !data ? (
          <EmptyState title={T("Loading member…")} />
        ) : (
          <>
            <header className="space-y-2">
              <div className="flex min-w-0 items-center gap-4">
                <UserAvatar
                  name={data.host.fullName}
                  src={null}
                  className="size-16 shrink-0 text-xl"
                />
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold">{data.host.displayName || data.host.fullName}</h1>
                  <p className="truncate text-sm text-muted-foreground">
                    {data.host.email}
                    {data.host.phone ? ` · ${data.host.phone}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {data.host.roles.map((role) => T(role)).join(", ")} · {T("joined")} {data.host.joinedOn}
                     {data.host.lastLoginAt ? ` · ${T("last sign-in")} ${new Date(data.host.lastLoginAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                 {data.host.superhost ? <Badge variant="secondary">{T("Superhost")}</Badge> : null}
                <IdentityBadge status={data.host.verificationStatus} />
                 {data.host.hostingSince ? <Badge variant="secondary">{T("Hosting since")} {data.host.hostingSince}</Badge> : null}
                <Badge variant="secondary">
                   {T("Commission")} {Math.round(data.host.commissionRate ?? data.host.defaultCommissionRate)}%
                </Badge>
                {data.host.banned ? (
                  <Badge className="border-0 bg-destructive/10 text-destructive">
                     {T("Banned")}{data.host.bannedReason ? ` · ${data.host.bannedReason}` : ""}
                  </Badge>
                ) : null}
                {data.host.suspended ? (
                  <Badge className="border-0 bg-destructive/10 text-destructive">
                     {T("Suspended")}{data.host.suspendedUntil ? ` ${T("until")} ${new Date(data.host.suspendedUntil).toLocaleDateString()}` : ""}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                 <Button
                   type="button" size="sm" variant="outline"
                  onClick={() =>
                    catalogApi
                      .syncIdentity(userId)
                       .then((r) => toast.success(`${T("Identity provider")}: ${T(r.stripeStatus)}${r.requirements.length ? ` (${r.requirements.length} ${T("items due")})` : ""}`))
                       .catch((e: unknown) => toast.error(e instanceof Error ? e.message : T("Could not reach the identity provider.")))
                  }
                >
                   {T("Refresh identity")}
                 </Button>
                 <Button
                   type="button" size="sm" variant="outline"
                  onClick={() =>
                     window.confirm(T("Turn off this member's two-step sign-in? They will sign in with password only until they set it up again.")) &&
                    catalogApi
                      .resetTwoFactor(userId)
                       .then(() => toast.success(T("Two-step sign-in reset.")))
                       .catch((e: unknown) => toast.error(e instanceof Error ? e.message : T("Reset failed.")))
                  }
                >
                   {T("Reset two-step sign-in")}
                 </Button>
              </div>
            </header>

            <section
              className={`space-y-4 border p-4 sm:p-5 ${data.host.verificationStatus === "pending" ? "border-amber-500/60 bg-amber-500/5" : "border-border bg-surface"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                 <h2 className="text-lg font-semibold">{T("Identity verification")}</h2>
                <IdentityBadge status={data.host.verificationStatus} />
              </div>
              {data.documents.length === 0 ? (
                 <p className="text-sm text-muted-foreground">{T("This member has not sent any identity document.")}</p>
              ) : (
                data.documents.map((doc) => (
                  <div key={doc.id} className="space-y-3">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                       <div><dt className="text-xs text-muted-foreground uppercase">{T("Document type")}</dt><dd className="font-medium capitalize">{T((doc.documentKind ?? "—").replace(/_/g, " "))}</dd></div>
                       <div><dt className="text-xs text-muted-foreground uppercase">{T("Document number")}</dt><dd className="font-medium break-all">{doc.documentReference ?? "—"}</dd></div>
                       <div><dt className="text-xs text-muted-foreground uppercase">{T("Sent on")}</dt><dd className="font-medium">{new Date(doc.createdAt).toLocaleString()}</dd></div>
                       <div><dt className="text-xs text-muted-foreground uppercase">{T("Decided on")}</dt><dd className="font-medium">{doc.decidedAt ? new Date(doc.decidedAt).toLocaleString() : "—"}</dd></div>
                    </dl>
                     {doc.notes ? <p className="rounded-md bg-muted p-3 text-sm"><span className="font-medium">{T("Note")}: </span>{doc.notes}</p> : null}
                    {doc.documentFiles && doc.documentFiles.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {doc.documentFiles.map((file, i) => (
                          <a key={i} href={file} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-border bg-muted">
                             <img src={file} alt={`${T("Identity proof")} ${i + 1}`} className="aspect-[4/3] w-full object-contain transition-transform group-hover:scale-105" />
                             <span className="block px-2 py-1 text-xs text-muted-foreground">{T("Proof")} {i + 1} · {T("open full size")}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                       <p className="text-sm text-muted-foreground">{T("No proof image uploaded.")}</p>
                    )}
                  </div>
                ))
              )}
              <div className="space-y-2 border-t border-border pt-4">
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                   placeholder={T("Note to the member (required when refusing)")}
                  maxLength={600}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void decide("verified")} disabled={deciding || data.host.verificationStatus === "verified"}>
                     <Check className="size-4" aria-hidden /> {T("Validate identity")}
                  </Button>
                  <Button variant="outline" className="text-destructive" onClick={() => void decide("rejected")} disabled={deciding}>
                     <X className="size-4" aria-hidden /> {T("Refuse")}
                  </Button>
                </div>
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
               <Stat label={T("Listings")} value={`${data.totals.publishedListings}/${data.totals.listings} ${T("live")}`} />
               <Stat label={T("Bookings")} value={data.totals.bookings} />
               <Stat label={T("Gross revenue")} value={money(data.totals.grossRevenueUsd)} />
               <Stat label={T("Commission")} value={money(data.totals.commissionUsd)} />
               <Stat label={T("Completed")} value={data.totals.completedBookings} />
               <Stat label={T("Cancelled")} value={data.totals.cancelledBookings} />
               <Stat label={T("Average rating")} value={data.totals.averageRating ? data.totals.averageRating.toFixed(2) : "—"} />
               <Stat label={T("Reviews")} value={data.totals.reviews} />
            </div>

             <Section title={T("Listings")}>
              {data.listings.length === 0 ? (
                 <EmptyState title={T("No listings yet.")} size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  <Paged rows={data.listings} text={rowText}>{(__rows) => __rows.map((listing) => (
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
                           {listing.city}, {listing.country} · {money(listing.nightlyUsd)}/{T("night")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                         <Badge variant="secondary" className="capitalize">{T(listing.status)}</Badge>
                         {listing.approved ? null : <Badge variant="outline">{T("Awaiting review")}</Badge>}
                      </div>
                    </li>
                  ))}</Paged>
                </ul>
              )}
            </Section>

             <Section title={T("Bookings received as a host")}>
              {data.bookings.length === 0 ? (
                 <EmptyState title={T("No bookings yet.")} size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  <Paged rows={data.bookings} text={rowText}>{(__rows) => __rows.map((booking) => (
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
                         <Badge variant="secondary" className="capitalize">{T(booking.status)}</Badge>
                        <span className="text-sm font-medium">{money(booking.totalUsd)}</span>
                      </div>
                    </li>
                  ))}</Paged>
                </ul>
              )}
            </Section>

             <Section title={T("Trips as a guest")}>
              {!data.trips || data.trips.length === 0 ? (
                 <EmptyState title={T("No stays booked as a guest.")} size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  <Paged rows={data.trips} text={rowText}>{(__rows) => __rows.map((trip) => (
                    <li key={trip.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium">{trip.reference} · {trip.propertyName}</p>
                        <p className="text-sm text-muted-foreground">{trip.checkIn} → {trip.checkOut}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <Badge variant="secondary" className="capitalize">{T(trip.status)}</Badge>
                        <span className="text-sm font-medium">{money(trip.totalUsd)}</span>
                      </div>
                    </li>
                  ))}</Paged>
                </ul>
              )}
            </Section>

             <Section title={T("Reviews")}>
              {data.reviews.length === 0 ? (
                 <EmptyState title={T("No reviews yet.")} size="compact" />
              ) : (
                <ul className="divide-y divide-border border border-border bg-surface">
                  <Paged rows={data.reviews} text={rowText}>{(__rows) => __rows.map((review) => (
                    <li key={review.id} className="space-y-1 p-4">
                      <p className="text-sm font-medium">
                        {review.rating.toFixed(1)} · {review.propertyName}
                        <span className="ml-2 font-normal text-muted-foreground">{review.authorName}</span>
                         {review.hidden ? <Badge className="ml-2" variant="outline">{T("Hidden")}</Badge> : null}
                      </p>
                      <p className="text-sm text-muted-foreground">{review.body}</p>
                    </li>
                  ))}</Paged>
                </ul>
              )}
            </Section>

          </>
        )}
      </div>
    </main>
  );
}
