import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, MessageSquare, CheckCircle2, MoreHorizontal, Paperclip, Search, Send, Smile, Star, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AccountShell } from "@/components/layout/AccountShell";
import { DataState, EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useEnsureStays } from "@/hooks/useEnsureStays";
import { UserAvatar } from "@/components/ui/user-avatar";
import { backendEnabled, remote, serverOffline } from "@/api/backend";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { pickCopy } from "@/i18n/copy";
import { cityName } from "@/models/property";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/** Grouped picker set: hosting chat leans on reactions, travel and logistics. */
const EMOJI_GROUPS: { key: string; emojis: string[] }[] = [
  { key: "reactions", emojis: ["😀", "😄", "😊", "🙂", "😉", "😍", "🤗", "😅", "😂", "🥳", "😎", "🙏", "👍", "👌", "👏", "💪", "❤️", "✨", "🎉", "🔥"] },
  { key: "stay", emojis: ["🏠", "🏡", "🛏️", "🛋️", "🚪", "🔑", "🧹", "🚿", "☕", "🍳", "📶", "🅿️", "🐶", "🚭", "🧺", "🌿", "🌅", "🏖️", "🏔️", "🗺️"] },
  { key: "trip", emojis: ["✈️", "🚗", "🚕", "🚆", "🧳", "📍", "📅", "⏰", "💬", "📷", "💳", "✅", "❓", "⚠️", "⭐", "🤝", "👋", "😴", "🍷", "🥂"] },
];

/** True when a message is only emoji, so it can render larger and bubble-free. */
function isEmojiOnly(text: string): boolean {
  const stripped = text.replace(/\s/g, "");
  if (!stripped || stripped.length > 12) return false;
  return /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\uFE0F|\u200D)+$/u.test(stripped);
}

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },
    { title: "Guest messages — RoomEasy" },
    { name: "description", content: "Manage RoomEasy guest conversations with listing and reservation context." },
    { property: "og:title", content: "Guest messages — RoomEasy" },
    { property: "og:description", content: "Listing-linked guest conversations and reservation details." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MessagesPage,
});


function MessagesPage() {
  const { locale, t } = useLanguage();
  const { format } = useCurrency();
  const { threads, bookings, accountDataStatus } = usePlatform();
  const allProperties = useAllProperties();
  // Loads the stays the conversations point at, even outside the first page.
  useEnsureStays(threads.map((thread) => thread.propertyId));
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread" | "details">("list");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<HTMLUListElement>(null);
  const active = threads.find((thread) => thread.id === activeId);
  const property = allProperties.find((item) => item.id === active?.propertyId);
  // Prefer the reservation the conversation is actually linked to; names are
  // ambiguous when the same guest has two stays at one listing.
  const booking = (active?.bookingId ? bookings.find((item) => item.id === active.bookingId) : undefined)
    ?? bookings.find((item) => item.propertyId === active?.propertyId && item.guestName === active?.withName.replace(" (host)", ""))
    ?? bookings.find((item) => item.propertyId === active?.propertyId);
  const copy = pickCopy(locale, {
    en: {
      inbox: "Inbox", conversations: "Conversations", search: "Search guest or listing", inquiry: "Inquiry for", today: "Today", details: "Stay details", reservation: "Reservation", checkIn: "Check-in", checkOut: "Check-out", guests: "Guests", nights: "nights", payout: "Host payout", status: "Status", confirmed: "Confirmed", property: "Listing", view: "View listing", placeholder: "Write a message…", info: "Details", select: "Select a conversation", response: "Usually responds within an hour", send: "Send message", attach: "Attach file", noResults: "No conversations found", newLabel: "New",
      emoji: "Add emoji", reactions: "Smileys", stay: "Stay", trip: "Travel", noReservation: "No reservation linked yet", sending: "Sending…", total: "Total paid",
    },
    fr: {
      inbox: "Boîte de réception", conversations: "Conversations", search: "Rechercher un voyageur ou une annonce", inquiry: "Demande pour", today: "Aujourd’hui", details: "Détails du séjour", reservation: "Réservation", checkIn: "Arrivée", checkOut: "Départ", guests: "Voyageurs", nights: "nuits", payout: "Versement hôte", status: "Statut", confirmed: "Confirmée", property: "Annonce", view: "Voir l’annonce", placeholder: "Écrire un message…", info: "Détails", select: "Sélectionnez une conversation", response: "Répond généralement en moins d’une heure", send: "Envoyer le message", attach: "Joindre un fichier", noResults: "Aucune conversation trouvée", newLabel: "Nouveau",
      emoji: "Ajouter un émoji", reactions: "Émotions", stay: "Logement", trip: "Voyage", noReservation: "Aucune réservation liée", sending: "Envoi…", total: "Total payé",
    },
    es: {
      inbox: "Bandeja de entrada", conversations: "Conversaciones", search: "Buscar huésped o anuncio", inquiry: "Consulta sobre", today: "Hoy", details: "Detalles de la estancia", reservation: "Reserva", checkIn: "Llegada", checkOut: "Salida", guests: "Huéspedes", nights: "noches", payout: "Pago al anfitrión", status: "Estado", confirmed: "Confirmada", property: "Anuncio", view: "Ver anuncio", placeholder: "Escribe un mensaje…", info: "Detalles", select: "Selecciona una conversación", response: "Suele responder en menos de una hora", send: "Enviar mensaje", attach: "Adjuntar archivo", noResults: "No se encontraron conversaciones", newLabel: "Nuevo",
      emoji: "Añadir emoji", reactions: "Emociones", stay: "Alojamiento", trip: "Viaje", noReservation: "Sin reserva vinculada", sending: "Enviando…", total: "Total pagado",
    },
    de: {
      inbox: "Postfach", conversations: "Unterhaltungen", search: "Gast oder Anzeige suchen", inquiry: "Anfrage für", today: "Heute", details: "Details zum Aufenthalt", reservation: "Reservierung", checkIn: "Anreise", checkOut: "Abreise", guests: "Gäste", nights: "Nächte", payout: "Auszahlung an Gastgeber", status: "Status", confirmed: "Bestätigt", property: "Anzeige", view: "Anzeige ansehen", placeholder: "Nachricht schreiben…", info: "Details", select: "Wähle eine Unterhaltung", response: "Antwortet meist innerhalb einer Stunde", send: "Nachricht senden", attach: "Datei anhängen", noResults: "Keine Unterhaltungen gefunden", newLabel: "Neu",
      emoji: "Emoji hinzufügen", reactions: "Smileys", stay: "Unterkunft", trip: "Reise", noReservation: "Noch keine Reservierung verknüpft", sending: "Senden…", total: "Gesamt bezahlt",
    },
    pt: {
      inbox: "Caixa de entrada", conversations: "Conversas", search: "Procurar hóspede ou anúncio", inquiry: "Pedido para", today: "Hoje", details: "Detalhes da estadia", reservation: "Reserva", checkIn: "Chegada", checkOut: "Partida", guests: "Hóspedes", nights: "noites", payout: "Pagamento ao anfitrião", status: "Estado", confirmed: "Confirmada", property: "Anúncio", view: "Ver anúncio", placeholder: "Escrever uma mensagem…", info: "Detalhes", select: "Selecione uma conversa", response: "Costuma responder em menos de uma hora", send: "Enviar mensagem", attach: "Anexar ficheiro", noResults: "Nenhuma conversa encontrada", newLabel: "Novo",
      emoji: "Adicionar emoji", reactions: "Emoções", stay: "Alojamento", trip: "Viagem", noReservation: "Sem reserva associada", sending: "A enviar…", total: "Total pago",
    },
  });
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return threads;
    return threads.filter((thread) => {
      const listing = allProperties.find((item) => item.id === thread.propertyId);
      return `${thread.withName} ${listing?.name ?? ""}`.toLocaleLowerCase().includes(needle);
    });
  }, [allProperties, query, threads]);

  const messageCount = active?.messages.length ?? 0;

  // Always land on the newest message, and keep the cursor ready to type.
  useEffect(() => {
    const stream = streamRef.current;
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, [messageCount, activeId]);

  useEffect(() => {
    if (activeId && mobileView !== "details") inputRef.current?.focus();
  }, [activeId, mobileView]);

  function openThread(id: string) {
    setActiveId(id);
    setMobileView("thread");
    setPlatform((state) => ({ threads: state.threads.map((thread) => thread.id === id ? { ...thread, unread: 0 } : thread) }));
    void remote.markThreadRead(id);
  }

  function insertEmoji(emoji: string) {
    setDraft((current) => `${current}${emoji}`);
    setEmojiOpen(false);
    // Return focus so typing continues right after the emoji.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function send() {
    if (!draft.trim() || !active || sending) return;
    const text = draft.trim();
    const localId = `m-${Date.now()}`;
    setPlatform((state) => ({ threads: state.threads.map((thread) => thread.id === active.id ? { ...thread, messages: [...thread.messages, { id: localId, from: "me", text, time: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) }] } : thread) }));
    setDraft("");
    setSending(true);
    const saved = await remote.sendMessage(active.id, text);
    setSending(false);
    inputRef.current?.focus();
    if (backendEnabled && !serverOffline() && !saved) {
      // The message never reached the host: take it back out instead of
      // claiming it was sent.
      setPlatform((state) => ({ threads: state.threads.map((thread) => thread.id === active.id ? { ...thread, messages: thread.messages.filter((message) => message.id !== localId) } : thread) }));
      setDraft(text);
      return;
    }
    toast.success(t.app.messages.sent);
  }

  return (
    <AccountShell>
      {accountDataStatus !== "ready" ? (
        <DataState status={accountDataStatus} loading={t.app.common.loading} error={t.app.common.loadError} retry={t.app.common.retry} />
      ) : (<>
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-5">
        <div className="min-w-0"><p className="text-xs font-semibold text-primary">{copy.conversations}</p><h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{copy.inbox}</h1></div>
        <p className="hidden text-sm text-muted-foreground sm:block">{threads.reduce((sum, thread) => sum + thread.unread, 0)} {t.app.messages.unread}</p>
      </div>

      <div className="min-h-[calc(100dvh-12rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-lift lg:grid lg:h-[calc(100vh-11rem)] lg:min-h-[38rem] lg:grid-cols-[19rem_minmax(22rem,1fr)_19rem]">
        <aside className={cn("min-w-0 border-border lg:flex lg:flex-col lg:border-r", mobileView === "list" ? "flex flex-col" : "hidden")}>
          <div className="border-b border-border p-4">
            <div className="relative"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="h-10 bg-background pl-9 text-xs" /></div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {filtered.map((thread) => {
              const listing = allProperties.find((item) => item.id === thread.propertyId);
              const last = thread.messages.at(-1);
              const selected = thread.id === activeId;
              return <li key={thread.id}>
                <Button variant="ghost" onClick={() => openThread(thread.id)} className={cn("relative h-auto w-full justify-start rounded-none border-b border-border/70 px-4 py-4 text-left transition-colors", selected && "bg-primary/10 hover:bg-primary/10")}>
                  <span className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 whitespace-normal">
                    {selected ? <span className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-primary" /> : null}<span className="relative block size-10 shrink-0"><UserAvatar name={thread.withName} src={thread.withAvatar} className="size-10" />{thread.unread > 0 ? <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-surface bg-primary" /> : null}</span>
                    <span className="min-w-0"><span className="flex items-baseline justify-between gap-2"><strong className="truncate text-sm">{thread.withName}</strong><span className="shrink-0 text-[10px] font-normal text-muted-foreground">{last?.time}</span></span><span className="mt-1 block truncate text-[11px] font-semibold text-primary">{copy.inquiry} {listing?.name}</span><span className="mt-1 block truncate text-xs font-normal text-muted-foreground">{last?.text}</span></span>
                  </span>
                </Button>
              </li>;
            })}
            {filtered.length === 0 ? <li className="p-4"><EmptyState icon={MessageSquare} title={copy.noResults} size="compact" /></li> : null}
          </ul>
        </aside>

        <section className={cn("min-w-0 flex-col", mobileView === "thread" ? "flex" : "hidden lg:flex")}>
          {active && property ? <>
            <header className="grid h-[4.75rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileView("list")} aria-label={copy.conversations}><ArrowLeft /></Button>
              <div className="flex min-w-0 items-center gap-3"><UserAvatar name={active.withName} src={active.withAvatar} className="size-9" /><div className="min-w-0"><h2 className="truncate font-display text-base font-semibold">{active.withName}</h2><p className="truncate text-xs text-muted-foreground">{property.name}</p></div></div>
              <div className="flex gap-1"><Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileView("details")}>{copy.info}</Button><Button variant="ghost" size="icon" aria-label="More options"><MoreHorizontal /></Button></div>
            </header>
             <ul ref={streamRef} className="flex-1 space-y-4 overflow-y-auto bg-background/70 p-4 sm:p-6">
               <li className="mx-auto w-fit rounded-full border border-border bg-surface px-3 py-1 text-[10px] font-semibold text-muted-foreground">{copy.today}</li>
                {active.messages.map((message) => {
                  const emojiOnly = isEmojiOnly(message.text);
                  return <li key={message.id} className={cn("flex", message.from === "me" ? "justify-end" : "justify-start")}><div className={cn(emojiOnly ? "max-w-[86%] px-1 py-1" : "max-w-[86%] px-4 py-3 text-sm shadow-sm sm:max-w-[72%]", !emojiOnly && (message.from === "me" ? "rounded-l-lg rounded-tr-lg bg-primary text-primary-foreground" : "rounded-r-lg rounded-tl-lg border border-border bg-surface"))}><p className={cn("leading-relaxed", emojiOnly && "text-4xl leading-none")}>{message.text}</p><p className={cn("mt-1.5 text-[10px]", !emojiOnly && message.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground", emojiOnly && (message.from === "me" ? "text-right" : "text-left"))}>{message.time}</p></div></li>;
                })}
            </ul>
             <form className="sticky bottom-0 border-t border-border bg-surface p-3 sm:p-4" onSubmit={(event) => { event.preventDefault(); send(); }}>
               <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-1 rounded-lg border border-input bg-background p-1.5 focus-within:border-primary">
                 <Button type="button" variant="ghost" size="icon" aria-label={copy.attach}><Paperclip /></Button>
                 <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                   <PopoverTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={copy.emoji} aria-expanded={emojiOpen}><Smile /></Button></PopoverTrigger>
                   <PopoverContent align="start" side="top" sideOffset={10} className="w-[min(20rem,calc(100vw-2rem))] p-3">
                     <div className="space-y-3">
                       {EMOJI_GROUPS.map((group) => <section key={group.key} aria-label={copy[group.key as keyof typeof copy]}><p className="mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase">{copy[group.key as keyof typeof copy]}</p><div className="grid grid-cols-10 gap-1">{group.emojis.map((emoji) => <Button key={emoji} type="button" variant="ghost" className="size-7 p-0 text-lg" onClick={() => insertEmoji(emoji)} aria-label={`${copy.emoji} ${emoji}`}>{emoji}</Button>)}</div></section>)}
                     </div>
                   </PopoverContent>
                 </Popover>
                 <Input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={sending ? copy.sending : copy.placeholder} disabled={sending} className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0" />
                 <Button type="submit" size="icon" aria-label={copy.send} disabled={!draft.trim() || sending}><Send /></Button>
              </div>
            </form>
          </> : <p className="m-auto text-sm text-muted-foreground">{copy.select}</p>}
        </section>

        <aside className={cn("min-w-0 overflow-y-auto border-border bg-background/60 lg:block lg:border-l", mobileView === "details" ? "block" : "hidden")}>
          <div className="flex h-[4.75rem] items-center gap-3 border-b border-border px-4 lg:hidden"><Button variant="ghost" size="icon" onClick={() => setMobileView("thread")} aria-label={copy.conversations}><ArrowLeft /></Button><h2 className="font-display font-semibold">{copy.details}</h2></div>
          {property ? <div>
             <div className="relative"><img src={property.image} alt={property.name} className="aspect-[16/10] w-full object-cover" />{booking ? <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-surface/95 px-2 py-1 text-[10px] font-semibold text-primary"><CheckCircle2 className="size-3" />{t.app.status[booking.status]}</span> : null}</div>
            <div className="p-5"><p className="text-[10px] font-semibold text-muted-foreground uppercase">{copy.property}</p><h2 className="mt-1 font-display text-lg font-semibold">{property.name}</h2><p className="mt-1 text-xs text-muted-foreground">{cityName(property, locale)}</p><p className="mt-2 flex items-center gap-1 text-xs font-semibold"><Star className="size-3 fill-current text-primary" />{property.rating.toFixed(1)}</p>
              <Button asChild variant="outline" className="mt-4 w-full"><Link to="/stays/$propertyId" params={{ propertyId: property.id }}>{copy.view}</Link></Button>
               <div className="mt-6 border-t border-border pt-5"><p className="text-[10px] font-semibold text-muted-foreground uppercase">{copy.reservation}</p>{booking ? <dl className="mt-4 space-y-4 text-sm"><Detail icon={CalendarDays} label={copy.checkIn} value={booking.from} /><Detail icon={CalendarDays} label={copy.checkOut} value={booking.to} /><Detail icon={Users} label={copy.guests} value={`${booking.guests} · ${booking.nights} ${copy.nights}`} /></dl> : <p className="mt-3 text-sm text-muted-foreground">{copy.noReservation}</p>}</div>
               {booking ? <div className="mt-5 border-t border-border pt-5"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{copy.total}</span><strong>{format(Math.round(booking.totalUsd), { from: booking.currency })}</strong></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">{copy.status}</span><span className="font-semibold text-primary">{t.app.status[booking.status]}</span></div></div> : null}
            </div>
          </div> : null}
        </aside>
      </div>
      </>)}
    </AccountShell>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"><span className="grid size-8 place-items-center rounded-md bg-secondary text-primary"><Icon className="size-4" /></span><div className="min-w-0"><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="truncate font-semibold">{value}</dd></div></div>;
}