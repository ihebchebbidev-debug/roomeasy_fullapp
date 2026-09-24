/**
 * Back-office panels for the client's admin specification: reported listings,
 * identity checks and account closures, per-host commission, booking
 * interventions (forced cancellation, manual refund, date/amount change),
 * the support and dispute desk, the action history, queued notification
 * e-mails and period-over-period statistics with CSV export.
 *
 * Each panel loads its own data from the Node backend and hides itself when
 * the signed-in administrator's role does not carry the capability.
 */
import { useSmartPricingCopy } from "@/i18n/smartPricingCopy";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminOpsApi } from "@/api/http/adminOps.http";
import { ChartPanel, GroupedBars, RankingBars, StatTile } from "@/components/admin/AdminCharts";
import type {
  AccountingRowDto,
  AdminBookingDto,
  AdminBookingFilters,
  AuditEntryDto,
  CommissionReportRowDto,
  FinanceRange,
  FinanceRowDto,
  InvoiceDto,
  BookingConversationDto,
  BookingAuditDto,
  EmailStatusDto,
  HostCommissionDto,
  ListingReportDto,
  NotificationDto,
  StatsCompareDto,
  StatsInsightsDto,
  TicketDto,
  VerificationDto,
} from "@/api/http/adminOps.http";
import { useAdminCopy } from "@/i18n/adminCopy";
import { useCurrency } from "@/i18n/CurrencyProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Paged, rowText } from "@/components/admin/ListControls";

/* ------------------------------------------------------------------ shared */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">{children}</div>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-lg border border-border bg-surface p-4", className)}>{children}</div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <EmptyState title={text} size="compact" />
  );
}

/** Loads a list once, exposes a reload, and turns server errors into a toast. */
function useRemoteList<T>(load: () => Promise<T>, fallback: T) {
  const copy = useAdminCopy();
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await load());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    } finally {
      setLoading(false);
    }
  }, [load, copy.failed]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload, setData };
}

/** Runs a write, reports the outcome and refreshes the panel. */
async function run(action: () => Promise<unknown>, after: () => void, okText: string, failText: string) {
  try {
    await action();
    toast.success(okText);
    after();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : failText);
  }
}

/* ------------------------------------------------------ reported listings */

export function ListingReportsPanel() {
  const copy = useAdminCopy();
  const load = useCallback(() => adminOpsApi.listingReports("open"), []);
  const { data, loading, reload } = useRemoteList<ListingReportDto[]>(load, []);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  if (loading) return <Note text={copy.loading} />;

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-border bg-surface p-5">
      {data.length === 0 ? (
        <Note text={copy.empty} />
      ) : (
      <Paged rows={data} text={rowText}>{(__rows) => __rows.map((report) => (
        <div key={report.id} className="border-b border-border p-4 last:border-b-0 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{report.propertyName ?? report.listingId}</p>
            <Badge className="border-0 bg-amber-500/15 text-amber-700">{copy.reportOpen}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.reportedBy} {report.reporterName ?? "—"} · {new Date(report.createdAt).toLocaleDateString()} ·{" "}
            {report.reason}
          </p>
          {report.details ? <p className="mt-2 text-sm text-muted-foreground">{report.details}</p> : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              value={reasons[report.id] ?? ""}
              onChange={(e) => setReasons((s) => ({ ...s, [report.id]: e.target.value }))}
              placeholder={copy.offlineReason}
              aria-label={copy.offlineReason}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  const reason = (reasons[report.id] ?? "").trim();
                  if (reason.length < 5) return void toast.error(copy.reasonRequired);
                  void run(
                    () => adminOpsApi.unpublishListing(report.listingId, reason, report.id),
                    reload,
                    copy.saved,
                    copy.failed,
                  );
                }}
              >
                {copy.takeOffline}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void run(
                    () => adminOpsApi.setReportStatus(report.id, "resolved", reasons[report.id]?.trim() || undefined),
                    reload,
                    copy.saved,
                    copy.failed,
                  )
                }
              >
                {copy.markResolved}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void run(() => adminOpsApi.setReportStatus(report.id, "dismissed"), reload, copy.saved, copy.failed)
                }
              >
                {copy.dismiss}
              </Button>
            </div>
          </div>
        </div>
      ))}</Paged>
      )}
    </div>
  );
}

/* -------------------------------------------- identity checks & closures */

export function VerificationPanel() {
  const copy = useAdminCopy();
  const load = useCallback(() => adminOpsApi.verifications(), []);
  const { data, loading, reload } = useRemoteList<VerificationDto[]>(load, []);
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (loading) return <Note text={copy.loading} />;
  if (data.length === 0) return <Note text={copy.empty} />;

  const statusLabel = (status: VerificationDto["status"]) =>
    status === "verified" ? copy.identityVerified : status === "rejected" ? copy.identityRejected : copy.identityPending;

  return (
    <Shell>
      <div className="overflow-hidden rounded-lg border border-border bg-surface divide-y divide-border">
      <Paged rows={data} text={rowText}>{(__rows) => __rows.map((row) => (
        <div key={row.userId} className="p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{row.fullName}</p>
              <p className="truncate text-sm text-muted-foreground">{row.email}</p>
            </div>
            <Badge
              className={cn(
                "border-0",
                row.status === "verified"
                  ? "bg-emerald-500/15 text-emerald-700"
                  : row.status === "rejected"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/15 text-amber-700",
              )}
            >
              {statusLabel(row.status)}
            </Badge>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              value={notes[row.userId] ?? ""}
              onChange={(e) => setNotes((s) => ({ ...s, [row.userId]: e.target.value }))}
              placeholder={copy.optionalNote}
              aria-label={copy.optionalNote}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  void run(
                    () => adminOpsApi.setVerification(row.userId, "verified", notes[row.userId]?.trim() || undefined),
                    reload,
                    copy.saved,
                    copy.failed,
                  )
                }
              >
                {copy.approveIdentity}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void run(
                    () => adminOpsApi.setVerification(row.userId, "rejected", notes[row.userId]?.trim() || undefined),
                    reload,
                    copy.saved,
                    copy.failed,
                  )
                }
              >
                {copy.refuseIdentity}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  const reason = (notes[row.userId] ?? "").trim();
                  if (reason.length < 5) return void toast.error(copy.reasonRequired);
                  void run(() => adminOpsApi.banUser(row.userId, reason), reload, copy.saved, copy.failed);
                }}
              >
                {copy.ban}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void run(() => adminOpsApi.unbanUser(row.userId), reload, copy.saved, copy.failed)}
              >
                {copy.unban}
              </Button>
            </div>
          </div>
        </div>
      ))}</Paged>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------ per-host commission */

export function CommissionsPanel() {
  const copy = useAdminCopy();
  const load = useCallback(() => adminOpsApi.commissions(), []);
  const { data, loading, reload } = useRemoteList<HostCommissionDto[]>(load, []);
  const [rates, setRates] = useState<Record<string, string>>({});

  if (loading) return <Note text={copy.loading} />;
  if (data.length === 0) return <Note text={copy.empty} />;

  return (
    <Shell>
      <div className="overflow-hidden rounded-lg border border-border bg-surface divide-y divide-border">
      <Paged rows={data} text={rowText}>{(__rows) => __rows.map((row) => (
        <div key={row.hostId} className="p-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{row.hostName}</p>
              <p className="truncate text-sm text-muted-foreground">{row.email}</p>
            </div>
            <Badge variant="secondary">
              {row.commissionRate === null ? `${copy.defaultRate} ${row.defaultRate}%` : `${copy.ownRate} ${row.commissionRate}%`}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="w-32 space-y-1">
              <Label htmlFor={`rate-${row.hostId}`} className="text-xs">
                {copy.ratePercent}
              </Label>
              <Input
                id={`rate-${row.hostId}`}
                type="number"
                min={0}
                max={100}
                value={rates[row.hostId] ?? String(row.commissionRate ?? "")}
                onChange={(e) => setRates((s) => ({ ...s, [row.hostId]: e.target.value }))}
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                const raw = rates[row.hostId] ?? String(row.commissionRate ?? "");
                const value = Number(raw);
                if (raw.trim() === "" || Number.isNaN(value)) return void toast.error(copy.failed);
                void run(() => adminOpsApi.setCommission(row.hostId, value), reload, copy.saved, copy.failed);
              }}
            >
              {copy.save}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void run(() => adminOpsApi.setCommission(row.hostId, null), reload, copy.saved, copy.failed)}
            >
              {copy.useDefault}
            </Button>
          </div>
        </div>
      ))}</Paged>
      </div>
    </Shell>
  );
}

/* -------------------------------------------------- support & dispute desk */

export function SupportDeskPanel({ adminId }: { adminId: string | null }) {
  const copy = useAdminCopy();
  const [filter, setFilter] = useState<TicketDto["status"]>("open");
  const load = useCallback(() => adminOpsApi.tickets(filter), [filter]);
  const { data, loading, reload } = useRemoteList<TicketDto[]>(load, []);
  const [openTicket, setOpenTicket] = useState<TicketDto | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [actionReason, setActionReason] = useState("");

  const openThread = async (id: string) => {
    try {
      setOpenTicket(await adminOpsApi.ticket(id));
      setReply("");
      setInternal(false);
      setActionReason("");
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

  const filters: TicketDto["status"][] = [
    "open",
    "awaiting_reply",
    "escalated",
    "pending",
    "resolved",
    "closed",
  ];

  const filterBar = (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={filter === value ? "default" : "outline"}
          onClick={() => {
            setFilter(value);
            setOpenTicket(null);
          }}
        >
          {statusLabel(value)}
        </Button>
      ))}
    </div>
  );

  if (loading)
    return (
      <div>
        {filterBar}
        <Note text={copy.loading} />
      </div>
    );
  if (data.length === 0)
    return (
      <div>
        {filterBar}
        <Note text={copy.empty} />
      </div>
    );

  return (
    <div>
      {filterBar}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Shell>
        <Paged rows={data} text={rowText}>{(__rows) => __rows.map((ticket) => (
          <Button
            key={ticket.id}
            type="button"
            variant="ghost"
            onClick={() => void openThread(ticket.id)}
            className={cn(
              "h-auto w-full whitespace-normal rounded-md border border-border bg-surface p-4 text-left shadow-none transition-colors hover:bg-muted/50",
              openTicket?.id === ticket.id && "border-primary bg-muted/50",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{ticket.subject}</span>
              <Badge variant="secondary">{statusLabel(ticket.status)}</Badge>
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {copy.ticketRef} {ticket.reference} · {ticket.openedByName} · {ticket.category}
            </span>
          </Button>
        ))}</Paged>
      </Shell>


      {openTicket ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold">{openTicket.subject}</p>
              <p className="text-xs text-muted-foreground">
                {copy.ticketRef} {openTicket.reference} · {openTicket.openedByName}
                {openTicket.assigneeName ? ` · ${openTicket.assigneeName}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void run(
                    () => adminOpsApi.assignTicketToMe(openTicket.id, adminId),
                    () => void openThread(openTicket.id),
                    copy.saved,
                    copy.failed,
                  )
                }
              >
                {copy.assignToMe}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void run(
                    () => adminOpsApi.setTicketStatus(openTicket.id, "escalated"),
                    () => {
                      void openThread(openTicket.id);
                      void reload();
                    },
                    copy.saved,
                    copy.failed,
                  )
                }
              >
                {copy.ticketEscalated}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void run(
                    () => adminOpsApi.setTicketStatus(openTicket.id, "resolved"),
                    () => {
                      void openThread(openTicket.id);
                      void reload();
                    },
                    copy.saved,
                    copy.failed,
                  )
                }
              >
                {copy.resolveTicket}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void run(
                    () => adminOpsApi.setTicketStatus(openTicket.id, "closed"),
                    () => {
                      setOpenTicket(null);
                      void reload();
                    },
                    copy.saved,
                    copy.failed,
                  )
                }
              >
                {copy.closeTicket}
              </Button>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {(openTicket.messages ?? []).map((message) => (
              <li
                key={message.id}
                className={cn(
                  "rounded-md border border-border p-3 text-sm",
                  message.internalNote && "border-dashed bg-muted/40",
                )}
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {message.authorName} · {new Date(message.sentAt).toLocaleString()}
                  {message.internalNote ? ` · ${copy.internalNote}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-line">{message.body}</p>
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
                  if (!openTicket.bookingId) {
                    toast.error(copy.notLinkedBooking);
                    return;
                  }
                  void run(
                    () =>
                      adminOpsApi.ticketAction(openTicket.id, {
                        action: "cancel_booking",
                        reason: actionReason.trim(),
                        refundPercent: 100,
                      }),
                    () => {
                      setActionReason("");
                      void openThread(openTicket.id);
                      void reload();
                    },
                    copy.saved,
                    copy.failed,
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
                  if (!openTicket.openedById) {
                    toast.error(copy.notLinkedMember);
                    return;
                  }
                  void run(
                    () =>
                      adminOpsApi.ticketAction(openTicket.id, {
                        action: "suspend_member",
                        reason: actionReason.trim(),
                        days: 30,
                      }),
                    () => {
                      setActionReason("");
                      void openThread(openTicket.id);
                      void reload();
                    },
                    copy.saved,
                    copy.failed,
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
                  () => adminOpsApi.replyToTicket(openTicket.id, reply.trim(), internal),
                  () => {
                    setReply("");
                    void openThread(openTicket.id);
                    void reload();
                  },
                  copy.saved,
                  copy.failed,
                );
              }}
            >
              {copy.sendReply}
            </Button>
          </div>
        </Card>
      ) : (
        <Note text={copy.empty} />
      )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- booking interventions */

export function BookingActionsPanel() {
  const copy = useAdminCopy();
  const { format } = useCurrency();
  const [reference, setReference] = useState("");
  const [audit, setAudit] = useState<BookingAuditDto | null>(null);
  const [reason, setReason] = useState("");
  const [refundPercent, setRefundPercent] = useState("100");
  const [refundAmount, setRefundAmount] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [total, setTotal] = useState("");

  const loadBooking = async (id = reference.trim()) => {
    if (!id) return;
    try {
      setAudit(await adminOpsApi.bookingAudit(id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    }
  };

  const guardedReason = () => {
    const value = reason.trim();
    if (value.length < 5) {
      toast.error(copy.reasonRequired);
      return null;
    }
    return value;
  };

  return (
    <Shell>
      <Card>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[14rem] flex-1 space-y-1">
            <Label htmlFor="booking-ref">{copy.bookingRef}</Label>
            <Input
              id="booking-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="RE-XXXXXX"
            />
          </div>
          <Button onClick={() => void loadBooking()}>{copy.loadBooking}</Button>
        </div>
      </Card>

      {audit ? (
        <>
          <Card>
            <p className="font-semibold">
              {String(audit.booking['reference'] ?? reference)} · {String(audit.booking['status'] ?? "")}
            </p>
            <div className="mt-3 space-y-2">
              <Label htmlFor="admin-reason">{copy.reason}</Label>
              <Textarea
                id="admin-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={copy.reason}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="refund-percent">{copy.refundPercent}</Label>
                <Input
                  id="refund-percent"
                  type="number"
                  min={0}
                  max={100}
                  value={refundPercent}
                  onChange={(e) => setRefundPercent(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const value = guardedReason();
                    if (!value) return;
                    void run(
                      () => adminOpsApi.cancelBooking(reference.trim(), value, Number(refundPercent) || 0),
                      () => void loadBooking(),
                      copy.saved,
                      copy.failed,
                    );
                  }}
                >
                  {copy.forceCancel}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-amount">{copy.refundAmount}</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const value = guardedReason();
                    if (!value) return;
                    const amount = Number(refundAmount);
                    if (!amount || amount <= 0) return void toast.error(copy.failed);
                    void run(
                      () => adminOpsApi.refundBooking(reference.trim(), amount, value),
                      () => void loadBooking(),
                      copy.saved,
                      copy.failed,
                    );
                  }}
                >
                  {copy.partialRefund}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-check-in">{copy.changeBooking}</Label>
                <Input id="new-check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} aria-label={copy.checkIn} />
                <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} aria-label={copy.checkOut} />
                <Input
                  type="number"
                  min={0}
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder={copy.newTotal}
                  aria-label={copy.newTotal}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const value = guardedReason();
                    if (!value) return;
                    if (!checkIn && !checkOut && !total) return void toast.error(copy.failed);
                    void run(
                      () =>
                        adminOpsApi.adjustBooking(reference.trim(), {
                          ...(checkIn ? { checkIn } : {}),
                          ...(checkOut ? { checkOut } : {}),
                          ...(total ? { totalUsd: Number(total) } : {}),
                          reason: value,
                        }),
                      () => void loadBooking(),
                      copy.saved,
                      copy.failed,
                    );
                  }}
                >
                  {copy.save}
                </Button>
              </div>
            </div>
          </Card>

          {audit.refunds.length > 0 ? (
            <Card>
              <h3 className="font-display text-base font-semibold">{copy.refunds}</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {audit.refunds.map((refund) => (
                  <li key={refund.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {new Date(refund.createdAt).toLocaleDateString()} · {refund.reason ?? "—"}
                    </span>
                    <span className="font-semibold text-foreground">{format(refund.amountUsd)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card>
            <h3 className="font-display text-base font-semibold">{copy.history}</h3>
            {audit.history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{copy.empty}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {audit.history.map((entry, index) => (
                  <li key={`${entry.action}-${index}`}>
                    {new Date(entry.createdAt).toLocaleString()} · {entry.action}
                    {entry.adminName ? ` · ${entry.adminName}` : ""}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}
    </Shell>
  );
}

/* ----------------------------------------------------------- action history */

export function AuditPanel() {
  const copy = useAdminCopy();
  const load = useCallback(() => adminOpsApi.auditLog(), []);
  const { data, loading } = useRemoteList<AuditEntryDto[]>(load, []);

  if (loading) return <Note text={copy.loading} />;
  if (data.length === 0) return <Note text={copy.empty} />;

  return (
    <Card>
      <ul className="divide-y divide-border text-sm">
        <Paged rows={data} text={rowText}>{(__rows) => __rows.map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
            <span className="font-medium">{entry.action}</span>
            <span className="text-muted-foreground">
              {entry.target.kind} · {entry.adminName ?? "—"} · {new Date(entry.createdAt).toLocaleString()}
              {entry.reason ? ` · ${entry.reason}` : ""}
            </span>
          </li>
        ))}</Paged>
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------- notification queue */

/** SMTP + card-payment readiness, with a test send and a manual queue drain. */
function DeliverySettings() {
  const copy = useAdminCopy();
  const [status, setStatus] = useState<EmailStatusDto | null>(null);
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await adminOpsApi.emailStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const act = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(done);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;

  const mail = status.smtp;
  const pay = status.payments;

  return (
    <Card className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{copy.mailSetup}</span>
        <Badge
          className={cn(
            "border-0",
            mail.configured ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700",
          )}
        >
          {mail.configured ? copy.mailReady : mail.missing.includes("SMTP_PASSWORD") ? copy.mailPending : copy.mailMissing}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {copy.mailServer}: {mail.host ?? "—"}
        {mail.port ? `:${mail.port}` : ""} · {copy.mailSender}: {mail.from || "—"} · {copy.emailQueued}:{" "}
        {status.queue.queued} · {copy.emailFailed}: {status.queue.failed}
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <span className="grid gap-1">
          <Label htmlFor="mail-test" className="text-xs">
            {copy.mailTest}
          </Label>
          <Input
            id="mail-test"
            type="email"
            className="h-9 w-64"
            placeholder={copy.mailTestPlaceholder}
            value={testTo}
            onChange={(event) => setTestTo(event.target.value)}
          />
        </span>
        <Button
          size="sm"
          disabled={busy || testTo.trim().length < 5}
          onClick={() => void act(() => adminOpsApi.sendTestEmail(testTo.trim()), copy.saved)}
        >
          {copy.mailSend}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void act(async () => {
              const result = await adminOpsApi.verifyEmail();
              if (!result.ok) throw new Error(result.error ?? copy.failed);
            }, copy.mailReady)
          }
        >
          {copy.mailVerify}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void act(() => adminOpsApi.dispatchEmails(), copy.saved)}
        >
          {copy.mailDrain}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-sm font-semibold">{copy.payTitle}</span>
        <Badge
          className={cn(
            "border-0",
            pay.enabled && pay.mode === "live"
              ? "bg-emerald-500/15 text-emerald-700"
              : pay.enabled
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/15 text-amber-700",
          )}
        >
          {pay.enabled ? (pay.mode === "live" ? copy.payReady : copy.payTest) : copy.payMissing}
        </Badge>
      </div>
      {pay.enabled && !pay.webhookReady ? (
        <p className="text-xs text-amber-600">{copy.payWebhookMissing}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">{pay.currency}</p>
    </Card>
  );
}

export function NotificationsPanel() {
  const copy = useAdminCopy();
  const load = useCallback(() => adminOpsApi.notifications(), []);
  const { data, loading, reload } = useRemoteList<NotificationDto[]>(load, []);

  const retry = async (id: string) => {
    try {
      await adminOpsApi.retryNotification(id);
      toast.success(copy.saved);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    }
  };

  if (loading) return <Note text={copy.loading} />;

  const label = (status: string) =>
    status === "sent" ? copy.emailSent : status === "failed" ? copy.emailFailed : copy.emailQueued;

  return (
    <Shell>
      <DeliverySettings />
      {data.length === 0 ? (
        <Note text={copy.empty} />
      ) : (
        <Card>
          <ul className="divide-y divide-border text-sm">
            <Paged rows={data} text={rowText}>{(__rows) => __rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.subject}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {copy.recipient}: {row.recipientEmail} · {row.template}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "border-0",
                      row.status === "sent"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : row.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/15 text-amber-700",
                    )}
                  >
                    {label(row.status)}
                  </Badge>
                  {row.status === "failed" ? (
                    <Button size="sm" variant="outline" onClick={() => void retry(row.id)}>
                      {copy.mailRetry}
                    </Button>
                  ) : null}
                </span>
              </li>
            ))}</Paged>
          </ul>
        </Card>
      )}
    </Shell>
  );
}

/* ------------------------------------------- period-over-period statistics */

/** Bare bar chart: one column per period, scaled to the tallest value. */
function MiniBars({ points }: { points: { label: string; value: number; caption?: string }[] }) {
  const peak = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-1">
      {points.map((point) => (
        <div key={point.label} className="flex min-w-10 flex-1 flex-col items-center gap-1">
          <span className="text-[0.66rem] tabular-nums text-muted-foreground">{point.caption ?? point.value}</span>
          <div
            className="w-full rounded-t bg-primary/70"
            style={{ height: `${Math.max(2, (point.value / peak) * 96)}px` }}
          />
          <span className="text-[0.62rem] text-muted-foreground">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export function StatsComparePanel() {
  const sp = useSmartPricingCopy();
  const copy = useAdminCopy();
  const { format } = useCurrency();
  const [months, setMonths] = useState(6);
  const load = useCallback(() => adminOpsApi.statsCompare(months), [months]);
  const loadInsights = useCallback(() => adminOpsApi.statsInsights(months), [months]);
  const { data, loading } = useRemoteList<StatsCompareDto | null>(load, null);
  const { data: insights } = useRemoteList<StatsInsightsDto | null>(loadInsights, null);

  if (loading) return <Note text={copy.loading} />;
  if (!data) return <Note text={copy.empty} />;

  const rows = [
    { label: copy.bookings, now: String(data.current.bookings), before: String(data.previous.bookings), change: data.change.bookings },
    { label: copy.revenue, now: format(data.current.revenueUsd), before: format(data.previous.revenueUsd), change: data.change.revenueUsd },
    {
      label: copy.commission,
      now: format(data.current.commissionUsd),
      before: format(data.previous.commissionUsd),
      change: data.change.commissionUsd,
    },
  ];

  const shortMonth = (month: string) => month.slice(5);

  return (
    <Shell>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-40 space-y-1">
          <Label htmlFor="compare-months">{copy.months}</Label>
          <Input
            id="compare-months"
            type="number"
            min={1}
            max={12}
            value={months}
            onChange={(e) => setMonths(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
          />
        </div>
        <Button
          variant="outline"
          onClick={() =>
            void adminOpsApi.downloadStatsCsv(12).catch(() => toast.error(copy.failed))
          }
        >
          {copy.exportCsv}
        </Button>
        <Button
          variant="outline"
          onClick={() => void adminOpsApi.downloadStatsXlsx(12).catch(() => toast.error(copy.failed))}
        >
          {sp.excel}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <Card key={row.label}>
            <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{row.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{row.now}</p>
            <p className="text-xs text-muted-foreground">
              {copy.previousPeriod}: {row.before}
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-semibold",
                row.change >= 0 ? "text-emerald-600" : "text-destructive",
              )}
            >
              {row.change >= 0 ? "+" : ""}
              {row.change.toFixed(1)}%
            </p>
          </Card>
        ))}
      </div>

      {insights && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {copy.occupancy}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{insights.occupancy.rate}%</p>
              <p className="text-xs text-muted-foreground">
                {copy.occupancyHint}: {insights.occupancy.nightsBooked} / {insights.occupancy.nightsAvailable}
              </p>
            </Card>
            <Card>
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {copy.averageBasket}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                {format(insights.averageBasketUsd)}
              </p>
              <p className="text-xs text-muted-foreground">
                {copy.bookings}: {insights.basketBookings}
              </p>
            </Card>
          </div>

          <Card>
            <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {copy.occupancy}
            </p>
            <div className="mt-3">
              <MiniBars
                points={insights.monthlyOccupancy.map((row) => ({
                  label: shortMonth(row.month),
                  value: row.rate,
                  caption: `${row.rate}%`,
                }))}
              />
            </div>
          </Card>

          <Card>
            <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {copy.signupCurve}
            </p>
            <div className="mt-3">
              <MiniBars
                points={insights.signups.map((row) => ({ label: shortMonth(row.month), value: row.total }))}
              />
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {insights.signups.map((row) => (
                <li key={row.month} className="tabular-nums">
                  {row.month}: {copy.hostsLabel} {row.hosts} · {copy.guestsLabel} {row.guests}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {copy.topDestinations}
            </p>
            {insights.topDestinations.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{copy.empty}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {insights.topDestinations.map((row) => (
                  <li key={`${row.city}-${row.country}`} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {row.city}, {row.country}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.bookings} · {row.nights} {copy.nights} · {format(row.revenueUsd)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {copy.seasonality}
            </p>
            <div className="mt-3">
              <MiniBars
                points={insights.seasonality.map((row) => ({
                  label: row.label.slice(0, 3),
                  value: row.bookings,
                }))}
              />
            </div>
          </Card>
        </>
      )}
    </Shell>
  );
}

/* ---------------------------------------------------------- reservations */

/**
 * Global reservation list from the admin specification: filters by traveller,
 * host, listing and stay dates, plus a detail sheet showing the payment method
 * and the read-only traveller/host conversation.
 */
export function BookingsDeskPanel() {
  const copy = useAdminCopy();
  const { format } = useCurrency();
  const [filters, setFilters] = useState<AdminBookingFilters>({});
  const [applied, setApplied] = useState<AdminBookingFilters>({});
  const [rows, setRows] = useState<AdminBookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminBookingDto | null>(null);
  const [conversation, setConversation] = useState<BookingConversationDto | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void adminOpsApi
      .bookings(applied)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : copy.failed))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applied, copy.failed]);

  const open = async (booking: AdminBookingDto) => {
    setSelected(booking);
    setConversation(null);
    try {
      setConversation(await adminOpsApi.bookingConversation(booking.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    }
  };

  const field = (key: keyof AdminBookingFilters, label: string, type = "text") => (
    <div className="space-y-1">
      <Label htmlFor={`bk-${key}`}>{label}</Label>
      <Input
        id={`bk-${key}`}
        type={type}
        value={(filters[key] as string | undefined) ?? ""}
        onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value || undefined }))}
      />
    </div>
  );

  return (
    <Shell>
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {field("guest", copy.bkGuest)}
          {field("host", copy.bkHost)}
          {field("listing", copy.bkListing)}
          {field("from", copy.bkFrom, "date")}
          {field("to", copy.bkTo, "date")}
          <div className="space-y-1">
            <Label htmlFor="bk-status">{copy.bkStatus}</Label>
            <select
              id="bk-status"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters((prev) => {
                  const next = { ...prev };
                  if (e.target.value) next.status = e.target.value as NonNullable<AdminBookingFilters["status"]>;
                  else delete next.status;
                  return next;
                })
              }
            >
              <option value="">{copy.bkAll}</option>
              {(["pending", "confirmed", "completed", "cancelled", "declined"] as const).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setApplied({ ...filters })}>
            {copy.bkApply}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFilters({});
              setApplied({});
            }}
          >
            {copy.bkClear}
          </Button>
          <span className="self-center text-sm text-muted-foreground">
            {rows.length} {copy.bkResults}
          </span>
        </div>
      </Card>

      {loading ? (
        <Note text={copy.loading} />
      ) : rows.length === 0 ? (
        <Note text={copy.empty} />
      ) : (
        <div className="grid gap-2">
          <Paged rows={rows} text={rowText}>{(__rows) => __rows.map((row) => (
            <Card key={row.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {row.reference} · {row.propertyName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {row.guest.name} · {row.checkIn} → {row.checkOut} · {row.nights} {copy.bkNights}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{row.status}</Badge>
                <span className="text-sm font-semibold tabular-nums">{format(row.price.totalUsd)}</span>
                <Button size="sm" variant="outline" onClick={() => void open(row)}>
                  {copy.bkDetails}
                </Button>
              </div>
            </Card>
          ))}</Paged>
        </div>
      )}

      {selected ? (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {selected.reference} · {selected.propertyName}
              </p>
              <p className="text-sm text-muted-foreground">
                {selected.guest.name}
                {selected.guest.email ? ` · ${selected.guest.email}` : ""}
                {selected.guest.phone ? ` · ${selected.guest.phone}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {selected.checkIn} → {selected.checkOut} · {selected.guests} · {format(selected.price.totalUsd)}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
              ✕
            </Button>
          </div>

          <p className="mt-4 text-sm">
            <span className="font-semibold">{copy.bkPayment}: </span>
            {selected.payment
              ? `${selected.payment.method} ${selected.payment.brand} ···· ${selected.payment.last4} · ${selected.payment.status}` +
                (selected.payment.refundedUsd > 0 ? ` · ${copy.bkRefunded} ${format(selected.payment.refundedUsd)}` : "")
              : copy.bkNoPayment}
          </p>

          <p className="mt-4 font-semibold">{copy.bkConversation}</p>
          {conversation && conversation.messages.length > 0 ? (
            <div className="mt-2 grid max-h-80 gap-2 overflow-y-auto">
              {conversation.messages.map((message) => (
                <div key={message.id} className="rounded-md border border-border p-2 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {message.senderName ?? message.senderRole} · {new Date(message.sentAt).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{copy.bkNoConversation}</p>
          )}
        </Card>
      ) : null}
    </Shell>
  );
}

/* ------------------------------------------------------------------ finance */

/**
 * Finance desk: the payment state of every reservation, the commission owed
 * per host for the chosen period, accounting totals by month/quarter/year with
 * a spreadsheet export, and a printable invoice for a single reservation.
 */
export function FinancePanel() {
  const sp = useSmartPricingCopy();
  const copy = useAdminCopy();
  const { format } = useCurrency();
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [range, setRange] = useState<FinanceRange>({});
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);

  const loadLedger = useCallback(
    () => adminOpsApi.financeLedger({ ...range, paymentStatus }),
    [range, paymentStatus],
  );
  const loadReport = useCallback(() => adminOpsApi.commissionReport(range), [range]);
  const loadAccounting = useCallback(() => adminOpsApi.accounting(period, range), [period, range]);

  const { data: ledger, loading } = useRemoteList<{ rows: FinanceRowDto[]; total: number }>(loadLedger, {
    rows: [],
    total: 0,
  });
  const { data: report } = useRemoteList<CommissionReportRowDto[]>(loadReport, []);
  const { data: accounting } = useRemoteList<AccountingRowDto[]>(loadAccounting, []);

  const openInvoice = async (bookingId: string) => {
    try {
      setInvoice(await adminOpsApi.invoice(bookingId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    }
  };

  const statuses = ["all", "none", "pending", "authorized", "paid", "failed", "refunded"];

  return (
    <Shell>
      <div className="grid grid-cols-2 items-end gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm sm:flex sm:flex-wrap sm:p-4">
        <div className="space-y-1">
          <Label className="text-xs">{copy.finFrom}</Label>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-full sm:w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{copy.finTo}</Label>
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-full sm:w-40" />
        </div>
        <div className="col-span-2 space-y-1 sm:col-span-1">
          <Label className="text-xs">{copy.finPeriod}</Label>
          <div className="flex flex-wrap gap-1">
            {(["month", "quarter", "year"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={period === value ? "default" : "outline"}
                onClick={() => setPeriod(value)}
              >
                {value === "month" ? copy.finMonth : value === "quarter" ? copy.finQuarter : copy.finYear}
              </Button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setRange({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}>
          {copy.finApply}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void adminOpsApi.downloadAccountingCsv(period, range)}
        >
          {copy.finExport}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void adminOpsApi.downloadAccountingXlsx(period, range).catch(() => toast.error(copy.failed))}
        >
          {sp.excel}
        </Button>
      </div>

      {accounting.length > 0 ? (() => {
        const sum = (k: keyof AccountingRowDto) => accounting.reduce((t, r) => t + Number(r[k] ?? 0), 0);
        const rev = sum("revenueUsd");
        const com = sum("commissionUsd");
        return (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label={copy.finRevenue} value={format(rev)} hint={`${sum("bookings")} ${copy.finBookings.toLowerCase()}`} />
              <StatTile label={copy.finCommission} value={format(com)} hint={rev > 0 ? `${Math.round((com / rev) * 100)}%` : undefined} tone="primary" />
              <StatTile label={copy.finHostNet} value={format(sum("hostNetUsd"))} />
              <StatTile label={copy.finRefunded} value={format(sum("refundedUsd"))} tone={sum("refundedUsd") > 0 ? "danger" : "default"} />
            </div>
            <ChartPanel title={copy.finAccounting} subtitle={copy.finRevenue + " · " + copy.finCommission + " · " + copy.finHostNet}>
              <GroupedBars
                data={accounting.map((r) => ({ period: r.period, revenueUsd: Math.round(r.revenueUsd), commissionUsd: Math.round(r.commissionUsd), hostNetUsd: Math.round(r.hostNetUsd) }))}
                xKey="period"
                series={[{ key: "revenueUsd", label: copy.finRevenue }, { key: "commissionUsd", label: copy.finCommission }, { key: "hostNetUsd", label: copy.finHostNet }]}
              />
            </ChartPanel>
          </>
        );
      })() : null}

      {report.length > 0 ? (
        <ChartPanel title={copy.finReport} subtitle={copy.finCommission}>
          <RankingBars label={copy.finCommission} data={[...report].sort((x, y) => y.commissionUsd - x.commissionUsd).slice(0, 8).map((r) => ({ name: r.hostName, value: Math.round(r.commissionUsd) }))} />
        </ChartPanel>
      ) : null}

      {/* accounting totals */}
      <Card>
        <p className="mb-3 text-sm font-semibold">{copy.finAccounting}</p>
        {accounting.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 pr-3">{copy.finPeriod}</th>
                  <th className="py-1 pr-3">{copy.finBookings}</th>
                  <th className="py-1 pr-3">{copy.finRevenue}</th>
                  <th className="py-1 pr-3">{copy.finCommission}</th>
                  <th className="py-1 pr-3">{copy.finHostNet}</th>
                  <th className="py-1 pr-3">{copy.finPaid}</th>
                  <th className="py-1 pr-3">{copy.finRefunded}</th>
                </tr>
              </thead>
              <tbody>
                {accounting.map((row) => (
                  <tr key={row.period} className="border-t border-border">
                    <td className="py-1 pr-3 tabular-nums">{row.period}</td>
                    <td className="py-1 pr-3 tabular-nums">{row.bookings}</td>
                    <td className="py-1 pr-3 tabular-nums">{format(row.revenueUsd)}</td>
                    <td className="py-1 pr-3 tabular-nums">{format(row.commissionUsd)}</td>
                    <td className="py-1 pr-3 tabular-nums">{format(row.hostNetUsd)}</td>
                    <td className="py-1 pr-3 tabular-nums">{format(row.paidUsd)}</td>
                    <td className="py-1 pr-3 tabular-nums">{format(row.refundedUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* commission per host */}
      <Card>
        <p className="mb-3 text-sm font-semibold">{copy.finReport}</p>
        {report.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="grid gap-2">
            <Paged rows={report} text={rowText}>{(__rows) => __rows.map((row) => (
              <div key={row.hostId} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-sm">
                <div>
                  <p className="font-medium">{row.hostName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.bookings} {copy.finBookings.toLowerCase()} · {row.commissionRate}%
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs tabular-nums">
                  <span>{copy.finRevenue}: {format(row.revenueUsd)}</span>
                  <span>{copy.finCommission}: {format(row.commissionUsd)}</span>
                  <span>{copy.finHostNet}: {format(row.hostNetUsd)}</span>
                  <span>{copy.finUnpaid}: {format(row.unpaidUsd)}</span>
                </div>
              </div>
            ))}</Paged>
          </div>
        )}
      </Card>

      {/* per-reservation payments */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{copy.finLedger}</p>
          <div className="flex flex-wrap gap-1">
            {statuses.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={paymentStatus === value ? "default" : "outline"}
                onClick={() => setPaymentStatus(value)}
              >
                {value === "all" ? copy.bkAll : value === "none" ? copy.finPaymentNone : value}
              </Button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : ledger.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="grid gap-2">
            <Paged rows={ledger.rows} text={rowText}>{(__rows) => __rows.map((row) => (
              <div
                key={row.bookingId}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {row.reference} · {row.propertyName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.guestName} → {row.hostName} · {row.checkIn} – {row.checkOut}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
                  <Badge variant={row.paymentStatus === "paid" ? "default" : "outline"}>
                    {copy.finPaymentStatus}: {row.paymentStatus === "none" ? copy.finPaymentNone : row.paymentStatus}
                  </Badge>
                  <span>{format(row.totalUsd)}</span>
                  <span>
                    {copy.finCommission} {format(row.commissionUsd)}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => void openInvoice(row.bookingId)}>
                    {copy.finInvoice}
                  </Button>
                </div>
              </div>
            ))}</Paged>
          </div>
        )}
      </Card>

      {invoice ? (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              {copy.finInvoiceFor} {invoice.booking.reference}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                {copy.finPrint}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  void adminOpsApi.downloadInvoicePdf(invoice.booking.bookingId).catch(() => toast.error(copy.failed))
                }
              >
                {sp.pdf}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setInvoice(null)}>
                {copy.finClose}
              </Button>
            </div>
          </div>
          <div className="grid gap-1 text-sm">
            <p className="font-medium">{invoice.booking.propertyName}</p>
            <p className="text-xs text-muted-foreground">
              {invoice.booking.guestName}
              {invoice.guestEmail ? ` · ${invoice.guestEmail}` : ""} · {invoice.booking.checkIn} –{" "}
              {invoice.booking.checkOut} · {invoice.nights} {copy.finNights}
            </p>
            <p className="text-xs text-muted-foreground">
              {copy.bkHost}: {invoice.booking.hostName}
              {invoice.hostEmail ? ` · ${invoice.hostEmail}` : ""}
            </p>
            <div className="mt-2 grid gap-1 text-sm">
              <div className="flex justify-between">
                <span>
                  {format(invoice.nightlyUsd)} × {invoice.nights} {copy.finNights}
                </span>
                <span className="tabular-nums">{format(invoice.baseSubtotalUsd)}</span>
              </div>
              {invoice.discounts.map((discount) => (
                <div key={discount.kind} className="flex justify-between text-muted-foreground">
                  <span>
                    {discount.kind} −{discount.percent}%
                  </span>
                  <span className="tabular-nums">−{format(discount.amountUsd)}</span>
                </div>
              ))}
              {invoice.cleaningFeeUsd > 0 ? (
                <div className="flex justify-between">
                  <span>{copy.finInvoice} · cleaning</span>
                  <span className="tabular-nums">{format(invoice.cleaningFeeUsd)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>{copy.finCommission}</span>
                <span className="tabular-nums">{format(invoice.booking.commissionUsd)}</span>
              </div>
              <div className="flex justify-between">
                <span>{copy.finHostNet}</span>
                <span className="tabular-nums">{format(invoice.booking.hostNetUsd)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <span>{copy.finRevenue}</span>
                <span className="tabular-nums">{format(invoice.booking.totalUsd)}</span>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </Shell>
  );
}
