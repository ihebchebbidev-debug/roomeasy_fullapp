import { Paged, rowText } from "@/components/admin/ListControls";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, MessageSquare, Receipt, Star, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AccountShell } from "@/components/layout/AccountShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataState, EmptyState as SharedEmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cityName } from "@/data/properties";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useEnsureStays } from "@/hooks/useEnsureStays";
import type { Booking, BookingStatus } from "@/data/platform";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { useClientCopy } from "@/i18n/clientCopy";
import { cancellationLabel, refundShare } from "@/lib/cancellation";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useExtra } from "@/i18n/extra";
import { useBookingCopy } from "@/i18n/booking";
import { useCancelBooking } from "@/hooks/useBookingApi";
import { backendEnabled, remote } from "@/api/backend";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { openConversation } from "@/lib/conversation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "My trips — RoomEasy" },
      { name: "description", content: "Track every RoomEasy stay you have requested, confirmed or completed." },
      { property: "og:title", content: "My trips — RoomEasy" },
      { property: "og:description", content: "Track every RoomEasy stay you have requested, confirmed or completed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TripsPage,
});

export function statusTone(status: BookingStatus) {
  return {
    pending: "bg-amber-500/15 text-amber-700",
    confirmed: "bg-emerald-500/15 text-emerald-700",
    declined: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    completed: "bg-primary/10 text-primary",
  }[status];
}

function TripsPage() {
  const { t, locale } = useLanguage();
  const { bookings, accountDataStatus } = usePlatform();
  // Loads any booked stay the browser does not hold yet.
  useEnsureStays(bookings.map((booking) => booking.propertyId));
  const upcoming = bookings.filter((b) => ["pending", "confirmed"].includes(b.status));
  const past = bookings.filter((b) => !["pending", "confirmed"].includes(b.status));

  return (
    <AccountShell title={t.app.trips.title} subtitle={t.app.trips.subtitle}>
      {accountDataStatus !== "ready" ? (
        <DataState status={accountDataStatus} loading={t.app.common.loading} error={t.app.common.loadError} retry={t.app.common.retry} />
      ) : (
      <Tabs defaultValue="upcoming">
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg bg-muted p-1 sm:w-80">
          <TabsTrigger value="upcoming">{t.app.trips.upcoming}</TabsTrigger>
          <TabsTrigger value="past">{t.app.trips.past}</TabsTrigger>
        </TabsList>
        {([["upcoming", upcoming], ["past", past]] as const).map(([key, list]) => (
          <TabsContent key={key} value={key} className="mt-6">
            {list.length === 0 ? (
              <SharedEmptyState
                icon={CalendarDays}
                title={t.app.trips.empty}
                action={
                  <Button asChild>
                    <Link to="/stays">{t.nav.stays}</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-5">
                <Paged rows={list} text={(x) => `${rowText(x)} ${(x as { propertyName?: string }).propertyName ?? ""}`}>{(__rows) => __rows.map((booking) => (
                  <TripCard key={booking.id} booking={booking} locale={locale} />
                ))}</Paged>
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
      )}
    </AccountShell>
  );
}

function TripCard({ booking, locale }: { booking: Booking; locale: string }) {
  const { t } = useLanguage();
  const { format } = useCurrency();
  const x = useExtra();
  const navigate = useNavigate();
  const c = useBookingCopy();
  const cancelBooking = useCancelBooking();
  const properties = useAllProperties();
  const cc = useClientCopy();
  const property = properties.find((p) => p.id === booking.propertyId);
  if (!property) return null;

  const policy = property.cancellationPolicy ?? "moderate";
  const daysBefore = Math.ceil((new Date(booking.from).getTime() - Date.now()) / 86_400_000);

  return (
    <li className="group overflow-hidden rounded-xl border border-border bg-surface transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-lift">
      <div className="grid sm:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="relative overflow-hidden"><img src={property.image} alt={property.name} loading="lazy" className="aspect-[16/9] h-full min-h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:aspect-auto" /></div>
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-0", statusTone(booking.status))}>{t.app.status[booking.status]}</Badge>
              <span className="text-xs text-muted-foreground">#{booking.id.toUpperCase()}</span>
            </div>
            <h2 className="mt-3 font-display text-lg font-bold leading-snug">{property.name}</h2>
            <p className="text-sm text-muted-foreground">{cityName(property, locale as never)}</p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden />{booking.from} → {booking.to}</li>
              <li className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden />{booking.guests} {t.listings.guests}</li>
              <li>{booking.nights} {t.app.trips.nights}</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {cc.cancellationPolicy}: <span className="font-semibold">{cancellationLabel(policy, cc)}</span>
              {["pending", "confirmed"].includes(booking.status)
                ? ` · ${cc.refundDue}: ${format(Math.round(booking.totalUsd * refundShare(policy, daysBefore)))}`
                : ""}
            </p>
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-4 lg:items-end lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            <p className="font-display text-xl font-bold tabular-nums">{format(booking.totalUsd)}</p>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap lg:justify-end">
               <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link to="/stays/$propertyId" params={{ propertyId: property.id }}>{t.app.trips.view}</Link>
              </Button>
               <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={async () => {
                  const opened = await openConversation(property.id, property.name, property.host?.name);
                  if (!opened) return;
                  toast.success(x.conversationOpened);
                  void navigate({ to: "/messages" });
                }}
              >
                <MessageSquare className="size-3.5" aria-hidden />{t.app.trips.message}
              </Button>
               <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  toast.success(t.app.trips.receiptReady);
                  void navigate({ to: "/booking/$bookingId", params: { bookingId: booking.id } });
                }}
              >
                <Receipt className="size-3.5" aria-hidden />{t.app.trips.receipt}
              </Button>
              {["pending", "confirmed"].includes(booking.status) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive sm:w-auto"
                  disabled={cancelBooking.isPending}
                  onClick={async () => {
                    try {
                      await cancelBooking.mutateAsync(booking.id);
                      setPlatform((current) => ({
                        bookings: current.bookings.map((row) =>
                          row.id === booking.id ? { ...row, status: "cancelled" as BookingStatus } : row,
                        ),
                      }));
                      toast.success(t.app.trips.cancelled);
                    } catch {
                      toast.error(c.errors.NOT_CANCELLABLE);
                    }
                  }}
                >
                  {t.app.trips.cancel}
                </Button>
              ) : null}
            </div>
          </div>
          {booking.status === "completed" ? <ReviewForm booking={booking} /> : null}
        </div>
      </div>
    </li>
  );
}

function ReviewForm({ booking }: { booking: Booking }) {
  const x = useExtra();
  const { session, reviews } = usePlatform();
  const existing = reviews.find((review) => review.id === `rv-${booking.id}`);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  if (existing) {
    return (
      <p className="mt-4 rounded-xl bg-secondary/60 p-3 text-sm lg:col-span-2">
        <span className="font-semibold">{x.alreadyReviewed}: </span>★ {existing.rating} — {existing.text}
      </p>
    );
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border border-border p-4 lg:col-span-2"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          const comment = text.trim();
          // The server owns published reviews; only mirror it locally once it saved.
          const saved = await remote.createReview(booking.id, rating, comment);
          if (backendEnabled && saved === null) return;
          setPlatform((state) => ({
            reviews: [
              {
                id: saved?.id ?? `rv-${booking.id}`,
                propertyId: booking.propertyId,
                author: session?.name ?? booking.guestName,
                rating,
                text: comment,
                date: new Date().toISOString().slice(0, 10),
              },
              ...state.reviews,
            ],
          }));
          toast.success(x.reviewPublished);
        })();
      }}
    >
      <p className="font-semibold">{x.leaveReview}</p>
      <div>
        <span className="text-xs text-muted-foreground">{x.yourRating}</span>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value}/5`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className="p-1"
            >
              <Star className={cn("size-5", value <= rating ? "fill-primary text-primary" : "text-muted-foreground")} aria-hidden />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`review-${booking.id}`} className="text-xs">{x.yourComment}</Label>
        <Textarea id={`review-${booking.id}`} rows={3} value={text} onChange={(event) => setText(event.target.value)} required />
      </div>
      <Button type="submit" size="sm">{x.publishReview}</Button>
    </form>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <SharedEmptyState title={text} />;
}
