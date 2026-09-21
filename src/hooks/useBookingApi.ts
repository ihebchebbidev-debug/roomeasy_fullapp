import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bookingApi } from "@/api";
import type { AvailabilityInput, QuoteInput } from "@/api/types";
import type { BookingDraft } from "@/models/booking";

export const bookingKeys = {
  all: ["bookings"] as const,
  detail: (id: string) => ["bookings", id] as const,
  availability: (input: AvailabilityInput) => ["availability", input] as const,
  quote: (input: QuoteInput) => ["quote", input] as const,
};

export function useAvailability(input: AvailabilityInput | null) {
  return useQuery({
    queryKey: input ? bookingKeys.availability(input) : ["availability", "idle"],
    queryFn: () => bookingApi.getAvailability(input!),
    enabled: Boolean(input?.from && input?.to && input?.propertyId),
  });
}

export function useQuote(input: QuoteInput | null) {
  return useQuery({
    queryKey: input ? bookingKeys.quote(input) : ["quote", "idle"],
    queryFn: () => bookingApi.getQuote(input!),
    enabled: Boolean(input?.from && input?.to && input?.propertyId),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingApi.getBooking(id),
    // Checkout seeds this entry, so a visitor who booked without an account
    // still sees their confirmation instead of an unauthorised refetch.
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: BookingDraft) => bookingApi.createBooking(draft),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
        predicate: (query) => query.queryKey.length === 1,
      });
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingApi.cancelBooking(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}
