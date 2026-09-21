import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { supportApi, type MemberTicket } from "@/api/http/support.http";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupportCopy } from "@/i18n/supportCopy";
import { useSession } from "@/hooks/usePlatform";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "My support requests — RoomEasy" },
      {
        name: "description",
        content:
          "Open a support request about a booking, a payment or a listing and follow our team's answers in one place.",
      },
      { property: "og:title", content: "My support requests — RoomEasy" },
      {
        property: "og:description",
        content: "Ask the RoomEasy team about a booking, a payment or a listing and follow the answer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const c = useSupportCopy();
  const session = useSession();
  const [tickets, setTickets] = useState<MemberTicket[]>([]);
  const [active, setActive] = useState<MemberTicket | null>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<MemberTicket["category"]>("booking");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTickets(await supportApi.myTickets());
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    void load();
  }, [session, load]);

  const statusLabel = (status: MemberTicket["status"]) =>
    ({ open: c.statusOpen, pending: c.statusPending, resolved: c.statusResolved, closed: c.statusClosed })[status];

  const categories: { value: MemberTicket["category"]; label: string }[] = [
    { value: "booking", label: c.catBooking },
    { value: "payment", label: c.catPayment },
    { value: "listing", label: c.catListing },
    { value: "account", label: c.catAccount },
    { value: "dispute", label: c.catDispute },
    { value: "other", label: c.catOther },
  ];

  async function submit() {
    setBusy(true);
    try {
      await supportApi.openTicket({ subject: subject.trim(), category, body: body.trim() });
      toast.success(c.sent);
      setSubject("");
      setBody("");
      await load();
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  }

  async function open(ticketId: string) {
    try {
      setActive(await supportApi.ticket(ticketId));
    } catch {
      toast.error(c.failed);
    }
  }

  async function sendReply() {
    if (!active || !reply.trim()) return;
    setBusy(true);
    try {
      const updated = await supportApi.reply(active.id, reply.trim());
      setActive(updated);
      setReply("");
      toast.success(c.replySent);
      await load();
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <AppShell title={c.supportTitle} subtitle={c.supportSubtitle}>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">{c.needSignIn}</p>
          <div className="mt-4 flex gap-2">
            <Button asChild>
              <Link to="/auth">{c.signIn}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/help">{c.helpFirst}</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (active) {
    return (
      <AppShell title={active.subject} subtitle={`${active.reference} · ${statusLabel(active.status)}`}>
        <Button variant="outline" onClick={() => setActive(null)}>
          {c.back}
        </Button>
        <div className="mt-6 space-y-3">
          {(active.messages ?? []).map((message) => (
            <div key={message.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">
                {message.authorName} · {new Date(message.sentAt).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm">{message.body}</p>
            </div>
          ))}
        </div>
        {active.status === "closed" ? null : (
          <div className="mt-6 space-y-2">
            <Textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder={c.replyPlaceholder}
              rows={4}
            />
            <Button onClick={() => void sendReply()} disabled={busy || !reply.trim()}>
              {c.sendReply}
            </Button>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell title={c.supportTitle} subtitle={c.supportSubtitle}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{c.myRequests}</h2>
          {loading ? <p className="text-sm text-muted-foreground">{c.loading}</p> : null}
          {!loading && tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c.noRequests}</p>
          ) : null}
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {ticket.reference} · {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{statusLabel(ticket.status)}</Badge>
                <Button size="sm" variant="outline" onClick={() => void open(ticket.id)}>
                  {c.view}
                </Button>
              </div>
            </div>
          ))}
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">{c.newRequest}</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">{c.subject}</Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={c.subjectPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-category">{c.category}</Label>
              <select
                id="support-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as MemberTicket["category"])}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-body">{c.message}</Label>
              <Textarea
                id="support-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={c.messagePlaceholder}
                rows={6}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => void submit()}
              disabled={busy || subject.trim().length < 3 || body.trim().length < 10}
            >
              {c.send}
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
