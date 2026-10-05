import { backendEnabled, remote, toThread } from "@/api/backend";
import { getPlatform, setPlatform } from "@/hooks/usePlatform";

/**
 * Opens (or starts) the conversation about one stay and puts it at the top of
 * the inbox. Used by the stay page, the trips list and the booking receipt so
 * every "message host" action behaves the same way.
 */
export async function openConversation(
  propertyId: string,
  propertyName: string,
  hostName?: string | null,
  /** Links the conversation to the reservation it is about, when known. */
  bookingId?: string,
): Promise<boolean> {
  const existing = getPlatform().threads.find((thread) => thread.propertyId === propertyId);
  // An existing conversation is reused, but it is re-pointed at this booking
  // when the guest opens it from a reservation it is not yet linked to.
  if (existing && (!bookingId || existing.bookingId === bookingId || !backendEnabled)) return true;

  if (backendEnabled) {
    const created = await remote.openThread(propertyId, bookingId);
    if (!created) return false;
    const thread = toThread(created);
    setPlatform((state) => ({
      threads: [
        existing ? { ...thread, messages: existing.messages, unread: existing.unread } : thread,
        ...state.threads.filter((row) => row.id !== thread.id),
      ],
    }));
    return true;
  }

  setPlatform((state) => ({
    threads: [
      {
        id: `th-${propertyId}`,
        propertyId,
        withName: `${hostName ?? "Host"} (host)`,
        unread: 0,
        messages: [],
      },
      ...state.threads,
    ],
  }));
  return true;
}
