import { translateAdmin } from "@/i18n/adminAutoCopy";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminOpsApi } from "@/api/http/adminOps.http";
import type { TicketDto } from "@/api/http/adminOps.http";
import { useAdminCopy } from "@/i18n/adminCopy";
import { useLanguage } from "@/i18n/LanguageProvider";
import { privatePageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin_/tickets/$ticketId")({
  head: () => ({
    meta: privatePageMeta(
      "Support ticket — RoomEasy back office",
      "Full support ticket thread with moderation and dispute actions.",
    ),
  }),
  component: AdminTicketDetail,
});

function AdminTicketDetail() {
  const { ticketId } = Route.useParams();
  const copy = useAdminCopy();
  const { t, locale } = useLanguage();
  const adminId = null;

  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [actionReason, setActionReason] = useState("");

  const reload = useCallback(async () => {
    try {
      setTicket(await adminOpsApi.ticket(ticketId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    } finally {
      setLoading(false);
    }
  }, [ticketId, copy.failed]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    try {
      await action();
      toast.success(copy.saved);
      after?.();
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    }
  };

  const statusLabel = (status: TicketDto["status"]) =>
    status === "open"
      ? copy.ticketOpen
      : status === "pending"
        ? copy.ticketPending
        : status === "awaiting_reply"
          ? copy.ticketAwaitingReply
          : status === "escalated"
            ? copy.ticketEscalated
            : status === "resolved"
              ? copy.ticketResolved
              : copy.ticketClosed;

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="justify-self-start">
            <Link to="/admin">
              <ArrowLeft className="size-4" aria-hidden />
              {t.app.admin.title}
            </Link>
          </Button>
          {ticket ? <Badge variant="secondary">{statusLabel(ticket.status)}</Badge> : null}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
        {loading ? (
          <EmptyState title={copy.loading} size="compact" />
        ) : !ticket ? (
          <EmptyState title={copy.empty} size="compact" />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
              {ticket.openedByAvatar ? (
                  <img src={ticket.openedByAvatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {(ticket.openedByName || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {copy.ticketRef} {ticket.reference} · {ticket.openedByName} · {translateAdmin(locale, ticket.category)}
                  {ticket.assigneeName ? ` · ${ticket.assigneeName}` : ""}
                </p>
              </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void run(() => adminOpsApi.assignTicketToMe(ticket.id, adminId))}
                >
                  {copy.assignToMe}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void run(() => adminOpsApi.setTicketStatus(ticket.id, "escalated"))}
                >
                  {copy.ticketEscalated}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void run(() => adminOpsApi.setTicketStatus(ticket.id, "resolved"))}
                >
                  {copy.resolveTicket}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void run(() => adminOpsApi.setTicketStatus(ticket.id, "closed"))}
                >
                  {copy.closeTicket}
                </Button>
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {(ticket.messages ?? []).map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "rounded-md border border-border p-3 text-sm",
                    message.internalNote && "border-dashed bg-muted/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {message.avatarUrl ? (
                      <img
                        src={message.avatarUrl}
                        alt={message.authorName}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                        {message.authorName.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {message.authorName} · {new Date(message.sentAt).toLocaleString()}
                        {message.internalNote ? ` · ${copy.internalNote}` : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-line">{message.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-md border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.ticketActions}
              </p>
              <Input
                className="mt-2"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={copy.actionReason}
                aria-label={copy.actionReason}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionReason.trim().length < 3}
                  onClick={() => {
                    if (!ticket.bookingId) {
                      toast.error(copy.notLinkedBooking);
                      return;
                    }
                    void run(
                      () =>
                        adminOpsApi.ticketAction(ticket.id, {
                          action: "cancel_booking",
                          reason: actionReason.trim(),
                          refundPercent: 100,
                        }),
                      () => setActionReason(""),
                    );
                  }}
                >
                  {copy.cancelStay}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionReason.trim().length < 3}
                  onClick={() => {
                    if (!ticket.openedById) {
                      toast.error(copy.notLinkedMember);
                      return;
                    }
                    void run(
                      () =>
                        adminOpsApi.ticketAction(ticket.id, {
                          action: "suspend_member",
                          reason: actionReason.trim(),
                          days: 30,
                        }),
                      () => setActionReason(""),
                    );
                  }}
                >
                  {copy.suspendMember}
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={copy.replyPlaceholder}
                aria-label={copy.reply}
                rows={4}
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                {copy.internalNote}
              </label>
              <Button
                size="sm"
                onClick={() => {
                  if (!reply.trim()) return;
                  void run(
                    () => adminOpsApi.replyToTicket(ticket.id, reply.trim(), internal),
                    () => setReply(""),
                  );
                }}
              >
                {copy.sendReply}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
