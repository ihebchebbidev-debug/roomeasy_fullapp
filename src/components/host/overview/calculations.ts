import type { Booking, HostListing, Thread } from "@/data/platform";

export const DAY_MS = 86_400_000;
export const REQUEST_WINDOW_MS = DAY_MS;

export function isoDay(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function percentageDifference(current: number, previous: number) {
  if (!previous) return current ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function overlapNights(booking: Booking, rangeStart: string, rangeEnd: string) {
  const start = Math.max(new Date(`${booking.from}T00:00:00`).getTime(), new Date(`${rangeStart}T00:00:00`).getTime());
  const end = Math.min(new Date(`${booking.to}T00:00:00`).getTime(), new Date(`${rangeEnd}T00:00:00`).getTime());
  return Math.max(0, Math.round((end - start) / DAY_MS));
}

export function occupancyForRange(bookings: Booking[], listings: HostListing[], rangeStart: string, rangeEnd: string) {
  const days = Math.max(0, Math.round((new Date(`${rangeEnd}T00:00:00`).getTime() - new Date(`${rangeStart}T00:00:00`).getTime()) / DAY_MS));
  const liveListingIds = new Set(listings.filter((listing) => listing.status === "published" && listing.approved).map((listing) => listing.propertyId));
  const available = liveListingIds.size * days;
  const booked = bookings
    .filter((booking) => booking.status === "confirmed" && liveListingIds.has(booking.propertyId))
    .reduce((sum, booking) => sum + overlapNights(booking, rangeStart, rangeEnd), 0);
  return { booked, available, rate: available ? Math.round((booked / available) * 100) : 0 };
}

export type ActivityEvent = {
  key: string;
  booking: Booking;
  date: string;
  kind: "checkIn" | "checkOut";
};

export function upcomingActivity(bookings: Booking[], start: string, end: string): ActivityEvent[] {
  return bookings
    .filter((booking) => booking.status === "confirmed")
    .flatMap((booking) => {
      const events: ActivityEvent[] = [];
      if (booking.from >= start && booking.from <= end) events.push({ key: `${booking.id}-in`, booking, date: booking.from, kind: "checkIn" });
      if (booking.to >= start && booking.to <= end) events.push({ key: `${booking.id}-out`, booking, date: booking.to, kind: "checkOut" });
      return events;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function requestExpiry(createdAt?: string) {
  return (createdAt ? new Date(createdAt).getTime() : Date.now()) + REQUEST_WINDOW_MS;
}

export function threadNeedsReply(thread: Thread) {
  return thread.messages.at(-1)?.from === "them";
}