import { usePlatform } from "@/hooks/usePlatform";
import { useRememberedState } from "@/hooks/useRememberedState";
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
import { useAdminT } from "@/i18n/adminAutoCopy";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localizedSubject } from "@/i18n/emailSubjects";
import { useSmartPricingCopy } from "@/i18n/smartPricingCopy";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Check, FileText, ImageOff, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi, type AdminHostProfileDto } from "@/api/http/platform.http";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";
import { adminOpsApi } from "@/api/http/adminOps.http";
import { confirmAction } from "@/components/admin/ConfirmDialogHost";
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
import { Paged, rowText, type ListFilter } from "@/components/admin/ListControls";

/* ------------------------------------------------------------------ shared */

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">{children}</div>;
}

function Card({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={cn("min-w-0 rounded-lg border border-border bg-surface p-4", className)}>{children}</div>
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
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await load());
    } catch (error) {
      setError(true);
      toast.error(error instanceof Error ? error.message : copy.failed);
    } finally {
      setLoading(false);
    }
  }, [load, copy.failed]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
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
            <div className="flex min-w-0 items-center gap-3">
              {report.propertyImage ? (
                <img
                  src={report.propertyImage}
                  alt=""
                  loading="lazy"
                  className="h-14 w-20 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
                  <ImageOff className="size-5" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{report.propertyName ?? report.listingId}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserAvatar
                    name={report.reporterName ?? "?"}
                    src={report.reporterAvatar}
                    className="size-5"
                  />
                  <span className="truncate">
                    {copy.reportedBy} {report.reporterName ?? "—"} · {new Date(report.createdAt).toLocaleDateString()} ·{" "}
                    {report.reason}
                  </span>
                </p>
              </div>
            </div>
            <Badge className="border-0 bg-amber-500/15 text-amber-700">{copy.reportOpen}</Badge>
          </div>
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
                onClick={async () => {
                  const reason = (reasons[report.id] ?? "").trim();
                  if (reason.length < 5) return void toast.error(copy.reasonRequired);
                  if (!(await confirmAction("Take this listing offline?", "The listing will no longer be visible to guests."))) return;
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
                onClick={async () =>
                  (await confirmAction("Mark this report as resolved?")) && void run(
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
                onClick={async () =>
                  (await confirmAction("Dismiss this report?")) && void run(() => adminOpsApi.setReportStatus(report.id, "dismissed"), reload, copy.saved, copy.failed)
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
  const { users: platformUsers } = usePlatform();
  const avatarOf = (row: VerificationDto) =>
    row.avatarUrl ?? platformUsers.find((u) => u.id === row.userId)?.avatarUrl ?? null;

  const T = useAdminT();
  const [docsFor, setDocsFor] = useState<VerificationDto | null>(null);
  const rows = data.filter((row) => !row.email.endsWith("@deleted.invalid"));

  // Only show the loading note on first load: unmounting the list on reload cleared the search.
  if (loading && data.length === 0) return <Note text={copy.loading} />;
  if (rows.length === 0) return <Note text={copy.empty} />;

  const statusLabel = (status: VerificationDto["status"]) =>
    status === "verified" ? copy.identityVerified : status === "rejected" ? copy.identityRejected : copy.identityPending;

  const decide = (row: VerificationDto, status: "verified" | "rejected") =>
    run(
      () => adminOpsApi.setVerification(row.userId, status, notes[row.userId]?.trim() || undefined),
      reload,
      copy.saved,
      copy.failed,
    );

  return (
    <Shell>
      <IdentityDocumentsDialog
        row={docsFor}
        onClose={() => setDocsFor(null)}
        onDecide={async (status) => {
          if (!docsFor) return;
          const ok = await confirmAction(
            status === "verified" ? "Approve this identity?" : "Refuse this identity?",
            status === "verified" ? "The member will be marked as verified." : "The member will have to send a new document.",
          );
          if (!ok) return;
          await decide(docsFor, status);
          setDocsFor(null);
        }}
      />
      <div className="overflow-hidden rounded-lg border border-border bg-surface divide-y divide-border">
      <Paged rows={rows} text={rowText}>{(__rows) => __rows.map((row) => (
        <div
          key={row.userId}
          className={cn(
            "p-4 transition-colors hover:bg-muted/30 sm:px-5",
            row.status === "pending" && "border-l-4 border-l-amber-500 bg-amber-500/5",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/admin/hosts/$userId"
              params={{ userId: row.userId }}
              className="flex min-w-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <UserAvatar name={row.fullName} src={avatarOf(row)} className="size-11 shrink-0 text-base" />
              <div className="min-w-0">
                <p className="truncate font-semibold hover:underline">{row.fullName}</p>
                <p className="truncate text-sm text-muted-foreground">{row.email}</p>
              </div>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setDocsFor(row)}>
                <FileText className="size-4" />
                {T("See documents")}
              </Button>
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
                onClick={async () =>
                  (await confirmAction("Approve this identity?", "The member will be marked as verified.")) && void run(
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
                onClick={async () =>
                  (await confirmAction("Refuse this identity?", "The member will have to send a new document.")) && void run(
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
                  void confirmAction("Ban this member?", "They will no longer be able to use their account.").then((ok) => { if (ok) void run(() => adminOpsApi.banUser(row.userId, reason), reload, copy.saved, copy.failed); });
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

/** Shows the identity documents a member uploaded, with approve / refuse actions. */
function IdentityDocumentsDialog({
  row,
  onClose,
  onDecide,
}: {
  row: VerificationDto | null;
  onClose: () => void;
  onDecide: (status: "verified" | "rejected") => Promise<void>;
}) {
  const T = useAdminT();
  const [docs, setDocs] = useState<AdminHostProfileDto["documents"] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!row) return;
    let alive = true;
    setDocs(null);
    setFailed(false);
    adminApi
      .hostProfile(row.userId)
      .then((p) => alive && setDocs(p.documents))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [row]);

  const act = async (status: "verified" | "rejected") => {
    setBusy(true);
    try {
      await onDecide(status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={row !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{T("Identity documents")}</DialogTitle>
          <DialogDescription className="break-words">
            {row?.fullName} · {row?.email}
          </DialogDescription>
        </DialogHeader>
        {failed ? (
          <p className="text-sm text-destructive">{T("Could not load the documents.")}</p>
        ) : docs === null ? (
          <p className="text-sm text-muted-foreground">{T("Loading…")}</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{T("This member has not sent any identity document.")}</p>
        ) : (
          <div className="space-y-5">
            {docs.map((doc) => (
              <div key={doc.id} className="space-y-3">
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-muted-foreground uppercase">{T("Document type")}</dt><dd className="font-medium">{T((doc.documentKind ?? "—").replace(/_/g, " "))}</dd></div>
                  <div><dt className="text-xs text-muted-foreground uppercase">{T("Document number")}</dt><dd className="font-medium break-all">{doc.documentReference ?? "—"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground uppercase">{T("Sent on")}</dt><dd className="font-medium">{new Date(doc.createdAt).toLocaleString()}</dd></div>
                </dl>
                {doc.notes ? <p className="rounded-md bg-muted p-3 text-sm"><span className="font-medium">{T("Note")}: </span>{doc.notes}</p> : null}
                {doc.documentFiles && doc.documentFiles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {doc.documentFiles.map((file, i) => (
                      <a key={i} href={file} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border bg-muted">
                        <img src={file} alt={`${T("Identity proof")} ${i + 1}`} className="aspect-[4/3] w-full object-contain" />
                        <span className="block px-2 py-1 text-xs text-muted-foreground">{T("Proof")} {i + 1} · {T("open full size")}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{T("No proof image uploaded.")}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="flex-wrap gap-2">
          {row ? (
            <Button variant="ghost" asChild>
              <Link to="/admin/hosts/$userId" params={{ userId: row.userId }}>{T("Open member profile")}</Link>
            </Button>
          ) : null}
          <Button variant="outline" disabled={busy || row?.status === "rejected"} onClick={() => void act("rejected")}>
            <X className="size-4" />{T("Refuse")}
          </Button>
          <Button disabled={busy || row?.status === "verified"} onClick={() => void act("verified")}>
            <Check className="size-4" />{T("Approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <div className="rounded-2xl border border-border bg-surface p-5">
      <Paged rows={data} text={rowText}>{(__rows) => (
        <ul className="divide-y divide-border">
        {__rows.map((row) => (
        <li key={row.hostId} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {row.avatarUrl ? (
                <img
                  src={row.avatarUrl}
                  alt={row.hostName}
                  className="size-11 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                  {row.hostName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.hostName}</p>
                <p className="truncate text-sm text-muted-foreground">{row.email}</p>
              </div>
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
        </li>
        ))}
        </ul>
      )}</Paged>
      </div>
    </Shell>
  );
}

/* -------------------------------------------------- support & dispute desk */

export function SupportDeskPanel() {
  const T = useAdminT();
  const copy = useAdminCopy();
  const load = useCallback(() => adminOpsApi.tickets("all"), []);
  const { data, loading } = useRemoteList<TicketDto[]>(load, []);

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

  const statuses: TicketDto["status"][] = [
    "open",
    "awaiting_reply",
    "escalated",
    "pending",
    "resolved",
    "closed",
  ];

  const statusFilters: ListFilter<TicketDto>[] = statuses.map((status) => ({
    value: status,
    label: statusLabel(status),
    test: (ticket) => ticket.status === status,
  }));

  if (loading) return <Note text={copy.loading} />;
  if (data.length === 0) return <Note text={copy.empty} />;

  return (
    <Shell>
      <Paged rows={data} text={rowText} filters={statusFilters}>{(__rows) => (
        <ul className="col-span-full divide-y divide-border border-y border-border">
          {__rows.map((ticket) => (
            <li key={ticket.id} className="transition-colors hover:bg-muted/30">
              <Link
                to="/admin/tickets/$ticketId"
                params={{ ticketId: ticket.id }}
                className="flex min-w-0 items-center justify-between gap-4 p-4 text-left sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                {ticket.openedByAvatar ? (
                  <img src={ticket.openedByAvatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {(ticket.openedByName || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-sans text-sm font-semibold underline-offset-4 hover:underline">
                    {ticket.subject}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {copy.ticketRef} {ticket.reference} · {ticket.openedByName} · {T(ticket.category)}
                  </p>
                </div>
                </div>
                <Badge variant="secondary" className="shrink-0">{statusLabel(ticket.status)}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}</Paged>
    </Shell>
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
                      () => {
                        const pct = refundPercent.toString().trim() === "" ? NaN : Number(refundPercent);
                        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
                          return Promise.reject(new Error("Refund percent must be between 0 and 100"));
                        }
                        return adminOpsApi.cancelBooking(reference.trim(), value, pct);
                      },
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
  const T = useAdminT();
  const load = useCallback(() => adminOpsApi.auditLog(), []);
  const { data, loading } = useRemoteList<AuditEntryDto[]>(load, []);
  const [kind, setKind] = useRememberedState("admin.audit.kind", "all");
  const [admin, setAdmin] = useRememberedState("admin.audit.admin", "all");
  const [action, setAction] = useRememberedState("admin.audit.action", "all");
  const [from, setFrom] = useRememberedState("admin.audit.from", "");
  const [to, setTo] = useRememberedState("admin.audit.to", "");

  if (loading) return <Note text={copy.loading} />;
  if (data.length === 0) return <Note text={copy.empty} />;

  const uniq = (values: (string | null)[]) => Array.from(new Set(values.filter((v): v is string => !!v))).sort();
  const kinds = uniq(data.map((e) => e.target.kind));
  const admins = uniq(data.map((e) => e.adminName));
  const actions = uniq(data.map((e) => e.action));
  const rows = data.filter((e) => {
    if (kind !== "all" && e.target.kind !== kind) return false;
    if (admin !== "all" && e.adminName !== admin) return false;
    if (action !== "all" && e.action !== action) return false;
    const t = new Date(e.createdAt).getTime();
    if (from && t < new Date(from).getTime()) return false;
    if (to && t > new Date(to).getTime() + 86_399_999) return false;
    return true;
  });
  const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";
  const active = kind !== "all" || admin !== "all" || action !== "all" || from || to;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select aria-label={T("Action")} value={action} onChange={(e) => setAction(e.target.value)} className={sel}>
          <option value="all">{T("All actions")}</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select aria-label={T("Type")} value={kind} onChange={(e) => setKind(e.target.value)} className={sel}>
          <option value="all">{T("All types")}</option>
          {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select aria-label={T("Admin")} value={admin} onChange={(e) => setAdmin(e.target.value)} className={sel}>
          <option value="all">{T("All admins")}</option>
          {admins.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={T("From")} className="h-9 w-40" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={T("To")} className="h-9 w-40" />
        {active ? (
          <Button variant="ghost" size="sm" onClick={() => { setKind("all"); setAdmin("all"); setAction("all"); setFrom(""); setTo(""); }}>{T("Clear")}</Button>
        ) : null}
      </div>
      <ul className="divide-y divide-border text-sm">
        <Paged rows={rows} text={rowText}>{(__rows) => __rows.map((entry) => (
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
  const mailUnavailable = !mail.configured;

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
      {mailUnavailable ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700">
          {copy.mailConfigurationRequired}: {mail.missing.join(", ") || copy.mailMissing}
        </p>
      ) : null}

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
          disabled={busy || mailUnavailable || testTo.trim().length < 5}
          onClick={() => void act(() => adminOpsApi.sendTestEmail(testTo.trim()), copy.saved)}
        >
          {copy.mailSend}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || mailUnavailable}
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
          disabled={busy || mailUnavailable}
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
  const T = useAdminT();
  const { locale } = useLanguage();
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
                  <span className="block truncate font-medium">{localizedSubject(locale, row.subject)}</span>
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
            <p className="mt-2 [overflow-wrap:anywhere] font-display text-xl font-semibold leading-tight tabular-nums sm:text-2xl" title={row.now}>{row.now}</p>
            <p className="break-words text-xs text-muted-foreground">
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
               <p className="mt-2 [overflow-wrap:anywhere] font-display text-xl font-semibold leading-tight tabular-nums sm:text-2xl">{insights.occupancy.rate}%</p>
               <p className="break-words text-xs text-muted-foreground">
                {copy.occupancyHint}: {insights.occupancy.nightsBooked} / {insights.occupancy.nightsAvailable}
              </p>
            </Card>
            <Card>
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {copy.averageBasket}
              </p>
               <p className="mt-2 [overflow-wrap:anywhere] font-display text-xl font-semibold leading-tight tabular-nums sm:text-2xl">
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
                   <span className="break-words text-right tabular-nums text-muted-foreground">
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
  const T = useAdminT();
  const { locale } = useLanguage();
  const { format } = useCurrency();
  const [filters, setFilters] = useState<AdminBookingFilters>({});
  const [applied, setApplied] = useState<AdminBookingFilters>({});
  const [rows, setRows] = useState<AdminBookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminBookingDto | null>(null);
  const [conversation, setConversation] = useState<BookingConversationDto | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ checkIn: "", checkOut: "", totalUsd: "", reason: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const { users: platformUsers } = usePlatform();
  const bookingHost = selected?.hostId ? platformUsers.find((u) => u.id === selected.hostId) : undefined;

  // Escape closes the booking details window, like every other admin pop-up.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSelected(null); setEditing(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);


  const startEdit = (booking: AdminBookingDto) => {
    setEditForm({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalUsd: String(booking.price.totalUsd),
      reason: "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    if (editForm.reason.trim().length < 5) {
      toast.error(copy.reasonRequired);
      return;
    }
    const patch: { checkIn?: string; checkOut?: string; totalUsd?: number; reason: string } = {
      reason: editForm.reason.trim(),
    };
    if (editForm.checkIn && editForm.checkIn !== selected.checkIn) patch.checkIn = editForm.checkIn;
    if (editForm.checkOut && editForm.checkOut !== selected.checkOut) patch.checkOut = editForm.checkOut;
    const amount = Number(editForm.totalUsd);
    if (editForm.totalUsd.trim() !== "" && !Number.isNaN(amount) && amount !== selected.price.totalUsd) {
      patch.totalUsd = amount;
    }
    if (!patch.checkIn && !patch.checkOut && patch.totalUsd === undefined) {
      setEditing(false);
      return;
    }
    setSavingEdit(true);
    try {
      await adminOpsApi.adjustBooking(selected.id, patch);
      toast.success(copy.saved);
      setSelected({
        ...selected,
        checkIn: patch.checkIn ?? selected.checkIn,
        checkOut: patch.checkOut ?? selected.checkOut,
        price: { ...selected.price, totalUsd: patch.totalUsd ?? selected.price.totalUsd },
      });
      setEditing(false);
      setApplied((prev) => ({ ...prev }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.failed);
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    void adminOpsApi
      .bookings({ limit: 100, ...applied }) // server maximum page size
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
    } catch {
      // The server only opens guest/host messages from a support ticket (privacy rule).
      setConversation({ threadId: null, guestName: null, hostName: null, messages: [], locked: true } as BookingConversationDto & { locked: boolean });
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
        // Enter applies the filters, so a pasted reference searches straight away.
        onKeyDown={(e) => {
          if (e.key === "Enter") setApplied({ ...filters, [key]: e.currentTarget.value.trim() || undefined });
        }}
      />
    </div>
  );

  return (
    <Shell>
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {field("search", T("Booking reference"))}
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
                   {T(status)}
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
            {rows.length} {copy.bkResults}{rows.length >= 100 ? ` · ${T("showing the latest 100 — use the filters to narrow down")}` : ""}
          </span>
        </div>
      </Card>

      {loading ? (
        <Note text={copy.loading} />
      ) : rows.length === 0 ? (
        <Note text={copy.empty} />
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Paged rows={rows} text={rowText}>{(__rows) => (
            <ul className="col-span-full divide-y divide-border border-y border-border">
              {__rows.map((row) => (
                <li
                  key={row.id}
                  className="grid gap-4 p-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {row.propertyPhoto ? (
                      <img
                        src={row.propertyPhoto}
                        alt={row.propertyName}
                        loading="lazy"
                        className="size-16 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-16 shrink-0 rounded-md bg-muted" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-sans text-sm font-semibold">
                        {row.reference} · {row.propertyName}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {row.guest.name} · {row.checkIn} → {row.checkOut} · {row.nights} {copy.bkNights}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
                    <Badge variant="outline">{T(row.status)}</Badge>
                    <span className="break-words text-sm font-semibold tabular-nums">{format(row.price.totalUsd)}</span>
                    <Button size="sm" variant="outline" onClick={() => void open(row)}>
                      {copy.bkDetails}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}</Paged>
        </div>
      )}

      {selected ? (
        <div role="dialog" aria-modal="true" aria-label={selected.reference} className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8">
        <div className="mx-auto max-w-3xl">
          <Button size="sm" variant="outline" className="mb-3" onClick={() => { setSelected(null); setEditing(false); }}>
            ← {T("Back to reservations")}
          </Button>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {/* header: photo + reference + status */}
          <div className="flex items-start gap-4 border-b border-border p-5">
            {selected.propertyPhoto ? (
              <img
                src={selected.propertyPhoto}
                alt={selected.propertyName}
                className="size-20 shrink-0 rounded-xl border border-border object-cover"
              />
            ) : (
              <div className="size-20 shrink-0 rounded-xl border border-border bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{selected.propertyName}</p>
                <Badge variant="outline">{T(selected.status)}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {selected.reference} · {selected.propertyCity}, {selected.propertyCountry}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">{copy.bkFrom} → {copy.bkTo} : </span>
                  <span className="font-semibold">{selected.checkIn} → {selected.checkOut}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">{copy.refundAmount} : </span>
                  <span className="font-semibold">{format(selected.price.totalUsd)}</span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => (editing ? setEditing(false) : startEdit(selected))}>
                {copy.changeBooking}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setSelected(null); setEditing(false); }}>
                ✕
              </Button>
            </div>
          </div>

          {editing ? (
            <div className="border-b border-border bg-background/60 p-5">
              <p className="text-sm font-semibold">{copy.changeBooking}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="bk-edit-in">{copy.bkFrom}</Label>
                  <Input
                    id="bk-edit-in"
                    type="date"
                    value={editForm.checkIn}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, checkIn: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bk-edit-out">{copy.bkTo}</Label>
                  <Input
                    id="bk-edit-out"
                    type="date"
                    value={editForm.checkOut}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, checkOut: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bk-edit-amount">{copy.refundAmount} ({selected.currency ?? "EUR"})</Label>
                  <Input
                    id="bk-edit-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.totalUsd}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, totalUsd: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Label htmlFor="bk-edit-reason">{copy.reason}</Label>
                <Input
                  id="bk-edit-reason"
                  value={editForm.reason}
                  placeholder={copy.reasonRequired}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={savingEdit} onClick={() => void saveEdit()}>
                  {savingEdit ? "…" : copy.save}
                </Button>
                <Button size="sm" variant="outline" disabled={savingEdit} onClick={() => setEditing(false)}>
                  ✕
                </Button>
              </div>
            </div>
          ) : null}

          {/* info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.bkGuest ?? "Voyageur"}</p>
              <p className="mt-1 truncate text-sm font-semibold">{selected.guest.name}</p>
              {selected.guest.email ? <p className="truncate text-xs text-muted-foreground">{selected.guest.email}</p> : null}
              {selected.guest.phone ? <p className="truncate text-xs text-muted-foreground">{selected.guest.phone}</p> : null}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.bkHost ?? "Hôte"}</p>
              <p className="mt-1 truncate text-sm font-semibold">{selected.hostName ?? conversation?.hostName ?? bookingHost?.name ?? "—"}</p>
              {(selected.hostEmail ?? bookingHost?.email) ? <p className="truncate text-xs text-muted-foreground">{selected.hostEmail ?? bookingHost?.email}</p> : null}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.bkFrom} → {copy.bkTo}</p>
              <p className="mt-1 text-sm font-semibold">
                {selected.checkIn} → {selected.checkOut}
              </p>
              <p className="text-xs text-muted-foreground">
                {selected.nights} {copy.bkNights} · {selected.guests}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.bkListing}</p>
              <p className="mt-1 truncate text-sm font-semibold">{selected.propertyName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {selected.propertyCity}, {selected.propertyCountry}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.bkPayment}</p>
              <p className="mt-1 text-sm font-semibold">
                {selected.payment
                  ? [
                      T(selected.payment.method),
                      // Skip the brand when it only repeats the method ("card card").
                      selected.payment.brand && selected.payment.brand.toLowerCase() !== selected.payment.method.toLowerCase() ? selected.payment.brand : null,
                      selected.payment.last4 ? `···· ${selected.payment.last4}` : null,
                    ].filter(Boolean).join(" ") + ` · ${T(selected.payment.status)}`
                  : copy.bkNoPayment}
              </p>
              {selected.payment && selected.payment.refundedUsd > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {copy.bkRefunded} {format(selected.payment.refundedUsd)}
                </p>
              ) : null}
            </div>
          </div>

          {/* conversation */}
          <div className="p-5">
            <p className="text-sm font-semibold">{copy.bkConversation}</p>
            {conversation && conversation.messages.length > 0 ? (
              <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1">
                {conversation.messages.map((message) => (
                  <div key={message.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                      {message.senderName ?? T(message.senderRole)} · {new Date(message.sentAt).toLocaleString(locale)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {(conversation as { locked?: boolean } | null)?.locked
                  ? T("Messages between the guest and the host are private. Open a support ticket on this booking to read them.")
                  : copy.bkNoConversation}
              </p>
            )}
          </div>
        </div>
        </div>
        </div>
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
  const T = useAdminT();
  const sp = useSmartPricingCopy();
  const copy = useAdminCopy();
  const { format, formatCharged } = useCurrency();
  // Rows keep their own booking currency: never convert or mix them.
  const money = (amount: number, currency?: string) => formatCharged(amount, currency ?? "EUR");
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
      // The invoice renders under the long lists: bring it into view.
      requestAnimationFrame(() => document.getElementById("admin-invoice")?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
        const sum = (k: keyof AccountingRowDto, cur?: string) =>
          accounting.reduce((t, r) => (cur && (r.currency ?? "EUR") !== cur ? t : t + Number(r[k] ?? 0)), 0);
        // Never add different currencies together: one amount per currency.
        const currencies = Array.from(new Set(accounting.map((r) => r.currency ?? "DEV").filter(Boolean)));
        const perCurrency = (k: keyof AccountingRowDto) =>
          currencies.map((c) => money(sum(k, c), c)).join(" · ");
        const single = currencies.length === 1 ? currencies[0] : undefined;
        const rev = sum("revenueUsd", single);
        const com = sum("commissionUsd", single);

        return (
          <>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
              <StatTile label={copy.finRevenue} value={perCurrency("revenueUsd")} hint={`${sum("bookings")} ${copy.finBookings.toLowerCase()}`} />
              <StatTile label={copy.finCommission} value={perCurrency("commissionUsd")} hint={single && rev > 0 ? `${Math.round((com / rev) * 100)}%` : undefined} tone="primary" />
              <StatTile label={copy.finHostNet} value={perCurrency("hostNetUsd")} />
              <StatTile label={copy.finRefunded} value={perCurrency("refundedUsd")} tone={sum("refundedUsd") > 0 ? "danger" : "default"} />
            </div>
            {currencies.map((currency) => (
              <ChartPanel key={currency} title={`${copy.finAccounting} · ${currency}`} subtitle={copy.finRevenue + " · " + copy.finCommission + " · " + copy.finHostNet}>
                <GroupedBars
                  data={accounting.filter((r) => (r.currency ?? "DEV") === currency).map((r) => ({ period: r.period, revenueUsd: Math.round(r.revenueUsd), commissionUsd: Math.round(r.commissionUsd), hostNetUsd: Math.round(r.hostNetUsd) }))}
                  xKey="period"
                  series={[{ key: "revenueUsd", label: copy.finRevenue }, { key: "commissionUsd", label: copy.finCommission }, { key: "hostNetUsd", label: copy.finHostNet }]}
                />
              </ChartPanel>
            ))}
          </>
        );
      })() : null}

      {Array.from(new Set(report.map((row) => row.currency ?? "DEV"))).map((currency) => (
        <ChartPanel key={currency} title={`${copy.finReport} · ${currency}`} subtitle={copy.finCommission}>
          <RankingBars label={copy.finCommission} data={report.filter((row) => (row.currency ?? "DEV") === currency).sort((x, y) => y.commissionUsd - x.commissionUsd).slice(0, 8).map((r) => ({ name: r.hostName, value: Math.round(r.commissionUsd) }))} />
        </ChartPanel>
      ))}

      {/* accounting totals */}
      <Card>
        <p className="mb-3 text-sm font-semibold">{copy.finAccounting}</p>
        {accounting.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-max w-full text-sm">
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
                  <tr key={`${row.period}-${row.currency ?? ""}`} className="border-t border-border">
                    <td className="py-1 pr-3 tabular-nums">{row.period} · {row.currency ?? "EUR"}</td>
                    <td className="py-1 pr-3 tabular-nums">{row.bookings}</td>
                    <td className="py-1 pr-3 tabular-nums">{money(row.revenueUsd, row.currency)}</td>
                    <td className="py-1 pr-3 tabular-nums">{money(row.commissionUsd, row.currency)}</td>
                    <td className="py-1 pr-3 tabular-nums">{money(row.hostNetUsd, row.currency)}</td>
                    <td className="py-1 pr-3 tabular-nums">{money(row.paidUsd, row.currency)}</td>
                    <td className="py-1 pr-3 tabular-nums">{money(row.refundedUsd, row.currency)}</td>
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
              <div key={`${row.hostId}-${row.currency ?? ""}`} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-sm">
                <div>
                  <p className="font-medium">{row.hostName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.bookings} {copy.finBookings.toLowerCase()} · {row.commissionRate}% · {row.currency ?? "EUR"}
                  </p>
                </div>
                 <div className="grid w-full grid-cols-1 gap-x-4 gap-y-1 text-xs tabular-nums sm:w-auto sm:grid-cols-2 sm:text-right">
                   <span className="break-words">{copy.finRevenue}: {money(row.revenueUsd, row.currency)}</span>
                   <span className="break-words">{copy.finCommission}: {money(row.commissionUsd, row.currency)}</span>
                   <span className="break-words">{copy.finHostNet}: {money(row.hostNetUsd, row.currency)}</span>
                   <span className="break-words">{copy.finUnpaid}: {money(row.unpaidUsd, row.currency)}</span>
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
                {value === "all" ? copy.bkAll : value === "none" ? copy.finPaymentNone : T(value)}
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
                 <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs tabular-nums">
                  <Badge variant={row.paymentStatus === "paid" ? "default" : "outline"}>
                    {copy.finPaymentStatus}: {row.paymentStatus === "none" ? copy.finPaymentNone : T(row.paymentStatus)}
                  </Badge>
                   <span className="break-words">{money(row.totalUsd, row.currency)}</span>
                   <span className="break-words">
                    {copy.finCommission} {money(row.commissionUsd, row.currency)}
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
        <Card id="admin-invoice" className="scroll-mt-24">
           <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="text-sm font-semibold">
              {copy.finInvoiceFor} {invoice.booking.reference}
            </p>
             <div className="flex flex-wrap gap-2">
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
               <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <span>
                  {money(invoice.nightlyUsd, invoice.booking.currency)} × {invoice.nights} {copy.finNights}
                </span>
                 <span className="max-w-40 break-words text-right tabular-nums">{money(invoice.baseSubtotalUsd, invoice.booking.currency)}</span>
              </div>
              {invoice.discounts.map((discount) => (
                 <div key={discount.kind} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-muted-foreground">
                  <span>
                    {discount.kind} −{discount.percent}%
                  </span>
                   <span className="max-w-40 break-words text-right tabular-nums">−{money(discount.amountUsd, invoice.booking.currency)}</span>
                </div>
              ))}
              {invoice.cleaningFeeUsd > 0 ? (
                 <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <span>{copy.finCleaningFee}</span>
                   <span className="max-w-40 break-words text-right tabular-nums">{money(invoice.cleaningFeeUsd, invoice.booking.currency)}</span>
                </div>
              ) : null}
               <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <span>{copy.finCommission}</span>
                 <span className="max-w-40 break-words text-right tabular-nums">{money(invoice.booking.commissionUsd, invoice.booking.currency)}</span>
              </div>
               <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <span>{copy.finHostNet}</span>
                 <span className="max-w-40 break-words text-right tabular-nums">{money(invoice.booking.hostNetUsd, invoice.booking.currency)}</span>
              </div>
               <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border pt-1 font-semibold">
                <span>{copy.finRevenue}</span>
                 <span className="max-w-40 break-words text-right tabular-nums">{money(invoice.booking.totalUsd, invoice.booking.currency)}</span>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </Shell>
  );
}
