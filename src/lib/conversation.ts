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
  if (existing) return true;

  const lang = typeof document !== "undefined" ? document.documentElement.lang.slice(0, 2) : "en";
  const intros: Record<string, string> = {
    fr: `Bonjour ! J'ai une question au sujet de ${propertyName}.`,
    es: `¡Hola! Tengo una pregunta sobre ${propertyName}.`,
    de: `Hallo! Ich habe eine Frage zu ${propertyName}.`,
    pt: `Olá! Tenho uma pergunta sobre ${propertyName}.`,
  };
  const intro = intros[lang] ?? `Hi! I have a question about ${propertyName}.`;

  if (backendEnabled) {
    const created = await remote.startThread(propertyId, intro, bookingId);
    if (!created) return false;
    const thread = toThread(created);
    setPlatform((state) => ({
      threads: [thread, ...state.threads.filter((row) => row.id !== thread.id)],
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
        messages: [
          {
            id: "m-intro",
            from: "me" as const,
            text: intro,
            time: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      },
      ...state.threads,
    ],
  }));
  return true;
}
