/**
 * Client for the second half of the back office: listing reports, identity
 * verification, bans, per-host commission, forced cancellations and refunds,
 * the support desk, the audit trail, queued notification emails and the
 * period-over-period statistics (with CSV export).
 */
import { API_BASE_URL, getAccessToken, request } from "@/api/http/client";

export type AdminMeDto = {
  userId: string;
  email: string;
  roles: string[];
  capabilities: string[];
};

export type ListingReportDto = {
  id: string;
  listingId: string;
  propertyName: string | null;
  propertyImage: string | null;
  hostId: string | null;
  hostName: string | null;
  reporterId: string | null;
  reporterName: string | null;
  reporterAvatar: string | null;
  reason: "fraud" | "inappropriate" | "wrong_information" | "unavailable" | "safety" | "other";
  details: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolution: string | null;
  handledAt: string | null;
  createdAt: string;
};

export type VerificationDto = {
  userId: string;
  fullName: string;
  email: string;
  status: "pending" | "verified" | "rejected";
  documentKind: string | null;
  notes: string | null;
  decidedAt: string | null;
  accountVerified: boolean;
};

export type HostCommissionDto = {
  hostId: string;
  hostName: string;
  email: string;
  commissionRate: number | null;
  defaultRate: number;
  effectiveRate: number;
  note: string | null;
  updatedAt: string | null;
};

export type TicketMessageDto = {
  id: string;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  body: string;
  internalNote: boolean;
  sentAt: string;
};

export type TicketDto = {
  id: string;
  reference: string;
  subject: string;
  category: "booking" | "payment" | "listing" | "account" | "dispute" | "other";
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "pending" | "awaiting_reply" | "escalated" | "resolved" | "closed";
  openedById: string | null;
  openedByName: string;
  openedByRole: string;
  openedByEmail: string | null;
  bookingId: string | null;
  listingId: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  resolution: string | null;
  closedAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  messageCount?: number;
  messages?: TicketMessageDto[];
};

export type NotificationDto = {
  id: string;
  recipientEmail: string;
  template: string;
  subject: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

export type EmailStatusDto = {
  smtp: {
    configured: boolean;
    dryRun: boolean;
    host: string | null;
    port: number | null;
    secure: boolean;
    from: string;
    missing: string[];
  };
  payments: {
    enabled: boolean;
    mode: "live" | "test" | null;
    publishableKey: string | null;
    connectReady: boolean;
    webhookReady: boolean;
    currency: string;
    missing: string[];
  };
  queue: { queued: number; sending: number; sent: number; failed: number };
};

export type AuditEntryDto = {
  id: string;
  action: string;
  target: { kind: string; id: string };
  reason: string | null;
  metadata: Record<string, unknown>;
  adminName: string | null;
  createdAt: string;
};

export type BookingAuditDto = {
  booking: Record<string, unknown> & { reference?: string; status?: string; totalUsd?: number };
  refunds: { id: string; amountUsd: number; reason: string | null; status: string; createdAt: string }[];
  history: { action: string; reason: string | null; metadata: Record<string, unknown>; adminName: string | null; createdAt: string }[];
};

export type AdminBookingFilters = {
  status?: "pending" | "confirmed" | "declined" | "cancelled" | "completed";
  search?: string;
  guest?: string;
  host?: string;
  listing?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type AdminBookingDto = {
  id: string;
  reference: string;
  propertyId: string;
  propertyName: string;
  propertyCity: string;
  propertyCountry: string;
  hostId: string | null;
  guest: { name: string; email: string | null; phone: string | null };
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "completed";
  price: { total: number; totalUsd: number };
  payment: { method: string; brand: string; last4: string; status: string; reference: string; refundedUsd: number } | null;
  createdAt: string;
};

export type BookingConversationDto = {
  threadId: string | null;
  guestName: string | null;
  hostName: string | null;
  messages: { id: string; senderRole: "guest" | "host" | "admin" | "system"; senderName: string | null; text: string; sentAt: string }[];
};

export type StatsCompareDto = {
  months: number;
  current: { bookings: number; revenueUsd: number; commissionUsd: number };
  previous: { bookings: number; revenueUsd: number; commissionUsd: number };
  change: { bookings: number; revenueUsd: number; commissionUsd: number };
  series: { month: string; bookings: number; revenueUsd: number; commissionUsd: number }[];
};

export type StatsInsightsDto = {
  months: number;
  occupancy: { rate: number; nightsBooked: number; nightsAvailable: number };
  averageBasketUsd: number;
  basketBookings: number;
  monthlyOccupancy: { month: string; rate: number; nightsBooked: number; nightsAvailable: number }[];
  signups: { month: string; total: number; hosts: number; guests: number }[];
  topDestinations: { city: string; country: string; bookings: number; revenueUsd: number; nights: number }[];
  seasonality: { month: number; label: string; bookings: number; nights: number; revenueUsd: number }[];
};

export type FinanceRowDto = {
  bookingId: string;
  reference: string;
  createdAt: string;
  checkIn: string;
  checkOut: string;
  status: string;
  guestName: string;
  hostId: string;
  hostName: string;
  propertyName: string;
  totalUsd: number;
  commissionRate: number;
  commissionUsd: number;
  hostNetUsd: number;
  paymentStatus: "none" | "pending" | "authorized" | "paid" | "failed" | "refunded";
  paymentMethod: string | null;
  paymentReference: string | null;
  refundedUsd: number;
};

export type CommissionReportRowDto = {
  hostId: string;
  hostName: string;
  hostEmail: string | null;
  bookings: number;
  revenueUsd: number;
  commissionUsd: number;
  hostNetUsd: number;
  paidUsd: number;
  unpaidUsd: number;
  commissionRate: number;
};

export type AccountingRowDto = {
  period: string;
  bookings: number;
  revenueUsd: number;
  commissionUsd: number;
  hostNetUsd: number;
  serviceFeeUsd: number;
  taxesUsd: number;
  cleaningUsd: number;
  refundedUsd: number;
  paidUsd: number;
};

export type InvoiceDto = {
  booking: FinanceRowDto;
  guestEmail: string | null;
  guestPhone: string | null;
  hostEmail: string | null;
  nights: number;
  guests: number;
  nightlyUsd: number;
  baseSubtotalUsd: number;
  subtotalUsd: number;
  cleaningFeeUsd: number;
  serviceFeeUsd: number;
  taxesUsd: number;
  discounts: { kind: string; percent: number; amountUsd: number }[];
};

export type FinanceRange = { from?: string; to?: string };

export const adminOpsApi = {
  me: () => request<AdminMeDto>("/admin/me"),

  /* listing reports */
  listingReports: (status: ListingReportDto["status"] | "all" = "open") =>
    request<ListingReportDto[]>("/admin/listing-reports", { query: { status, limit: 50 } }),
  setReportStatus: (reportId: string, status: ListingReportDto["status"], resolution?: string) =>
    request<ListingReportDto>(`/admin/listing-reports/${encodeURIComponent(reportId)}/status`, {
      method: "POST",
      body: { status, ...(resolution ? { resolution } : {}) },
    }),
  unpublishListing: (listingId: string, reason: string, reportId?: string) =>
    request<unknown>(`/admin/listings/${encodeURIComponent(listingId)}/unpublish`, {
      method: "POST",
      body: { reason, ...(reportId ? { reportId } : {}) },
    }),

  /* members */
  verifications: (status?: VerificationDto["status"]) =>
    request<VerificationDto[]>("/admin/verifications", { query: { limit: 50, ...(status ? { status } : {}) } }),
  setVerification: (userId: string, status: VerificationDto["status"], notes?: string) =>
    request<{ userId: string; status: string }>(`/admin/users/${encodeURIComponent(userId)}/verification`, {
      method: "POST",
      body: { status, ...(notes ? { notes } : {}) },
    }),
  banUser: (userId: string, reason: string) =>
    request<unknown>(`/admin/users/${encodeURIComponent(userId)}/ban`, { method: "POST", body: { reason } }),
  unbanUser: (userId: string) =>
    request<unknown>(`/admin/users/${encodeURIComponent(userId)}/unban`, { method: "POST", body: {} }),

  /* commission */
  commissions: () => request<HostCommissionDto[]>("/admin/commissions", { query: { limit: 100 } }),
  setCommission: (hostId: string, commissionRate: number | null, note?: string) =>
    request<{ hostId: string; commissionRate: number | null }>(`/admin/commissions/${encodeURIComponent(hostId)}`, {
      method: "PUT",
      body: { commissionRate, ...(note ? { note } : {}) },
    }),

  /* bookings */
  bookings: (filters: AdminBookingFilters = {}) =>
    request<AdminBookingDto[]>("/admin/bookings", {
      query: {
        limit: filters.limit ?? 50,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.guest ? { guest: filters.guest } : {}),
        ...(filters.host ? { host: filters.host } : {}),
        ...(filters.listing ? { listing: filters.listing } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
      },
    }),
  bookingConversation: (bookingId: string) =>
    request<BookingConversationDto>(`/admin/bookings/${encodeURIComponent(bookingId)}/conversation`),
  bookingAudit: (bookingId: string) =>
    request<BookingAuditDto>(`/admin/bookings/${encodeURIComponent(bookingId)}/audit`),
  cancelBooking: (bookingId: string, reason: string, refundPercent: number) =>
    request<{ refundUsd: number }>(`/admin/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: "POST",
      body: { reason, refundPercent },
    }),
  refundBooking: (bookingId: string, amountUsd: number, reason: string) =>
    request<unknown>(`/admin/bookings/${encodeURIComponent(bookingId)}/refund`, {
      method: "POST",
      body: { amountUsd, reason },
    }),
  adjustBooking: (
    bookingId: string,
    patch: { checkIn?: string; checkOut?: string; totalUsd?: number; reason: string },
  ) => request<unknown>(`/admin/bookings/${encodeURIComponent(bookingId)}/adjust`, { method: "POST", body: patch }),

  /* support desk */
  tickets: (status: TicketDto["status"] | "all" = "open") =>
    request<TicketDto[]>("/admin/tickets", { query: { status, limit: 50 } }),
  ticket: (ticketId: string) => request<TicketDto>(`/admin/tickets/${encodeURIComponent(ticketId)}`),
  replyToTicket: (ticketId: string, body: string, internalNote = false) =>
    request<TicketDto>(`/admin/tickets/${encodeURIComponent(ticketId)}/messages`, {
      method: "POST",
      body: { body, internalNote },
    }),
  setTicketStatus: (ticketId: string, status: TicketDto["status"], resolution?: string) =>
    request<TicketDto>(`/admin/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: "POST",
      body: { status, ...(resolution ? { resolution } : {}) },
    }),
  /** Cancel, refund or suspend straight from the ticket. */
  ticketAction: (
    ticketId: string,
    body:
      | { action: "cancel_booking"; reason: string; refundPercent: number }
      | { action: "refund_booking"; reason: string; amountUsd: number }
      | { action: "suspend_member"; reason: string; days: number | null },
  ) => request<TicketDto>(`/admin/tickets/${encodeURIComponent(ticketId)}/action`, { method: "POST", body }),
  assignTicketToMe: (ticketId: string, adminId: string | null) =>
    request<TicketDto>(`/admin/tickets/${encodeURIComponent(ticketId)}/assign`, {
      method: "POST",
      body: { adminId },
    }),

  /* audit + notifications */
  auditLog: () => request<AuditEntryDto[]>("/admin/moderation-log", { query: { limit: 60 } }),
  notifications: () => request<NotificationDto[]>("/admin/notifications", { query: { limit: 50 } }),

  /* outgoing email: credentials health, manual drain, retry, test message */
  emailStatus: () => request<EmailStatusDto>("/admin/email/status"),
  verifyEmail: () => request<{ ok: boolean; error?: string }>("/admin/email/verify", { method: "POST" }),
  dispatchEmails: () => request<{ sent: number; failed: number }>("/admin/email/dispatch", { method: "POST" }),
  sendTestEmail: (to: string) =>
    request<{ queued: boolean; sent: number; failed: number }>("/admin/email/test", { method: "POST", body: { to } }),
  retryNotification: (id: string) =>
    request<{ retried: boolean }>(`/admin/notifications/${encodeURIComponent(id)}/retry`, { method: "POST" }),

  /* finance */
  financeLedger: (filters: FinanceRange & { paymentStatus?: string; hostId?: string; limit?: number } = {}) =>
    request<{ rows: FinanceRowDto[]; total: number }>("/admin/finance/ledger", {
      query: {
        limit: filters.limit ?? 50,
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(filters.hostId ? { hostId: filters.hostId } : {}),
        ...(filters.paymentStatus && filters.paymentStatus !== "all" ? { paymentStatus: filters.paymentStatus } : {}),
      },
    }),
  commissionReport: (range: FinanceRange = {}) =>
    request<CommissionReportRowDto[]>("/admin/finance/commission-report", {
      query: { ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) },
    }),
  accounting: (period: "month" | "quarter" | "year" = "month", range: FinanceRange = {}) =>
    request<AccountingRowDto[]>("/admin/finance/accounting", {
      query: { period, ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) },
    }),
  invoice: (bookingId: string) => request<InvoiceDto>(`/admin/finance/invoice/${encodeURIComponent(bookingId)}`),

  /** Accounting export as a spreadsheet file. */
  async downloadAccountingCsv(period: "month" | "quarter" | "year" = "month", range: FinanceRange = {}): Promise<void> {
    const token = getAccessToken();
    const base = API_BASE_URL || window.location.origin;
    const url = new URL(`${API_BASE_URL}/api/admin/finance/accounting.csv`, base);
    url.searchParams.set("period", period);
    if (range.from) url.searchParams.set("from", range.from);
    if (range.to) url.searchParams.set("to", range.to);
    const response = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!response.ok) throw new Error("export failed");
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `roomeasy-accounting-${period}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  },

  /* statistics */
  statsCompare: (months = 6) => request<StatsCompareDto>("/admin/stats/compare", { query: { months } }),
  statsInsights: (months = 12) => request<StatsInsightsDto>("/admin/stats/insights", { query: { months } }),

  /** The CSV export is a file download, so it bypasses the JSON envelope. */
  async downloadStatsCsv(months = 12): Promise<void> {
    const token = getAccessToken();
    const base = API_BASE_URL || window.location.origin;
    const url = new URL(`${API_BASE_URL}/api/admin/stats/export.csv`, base);
    url.searchParams.set("months", String(months));
    const response = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!response.ok) throw new Error("export failed");
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `roomeasy-statistics-${months}m.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  },

  downloadStatsXlsx: (months = 12) =>
    downloadApiFile(`/api/admin/stats/export.xlsx`, { months: String(months) }, `roomeasy-statistics-${months}m.xlsx`),
  downloadAccountingXlsx: (period: "month" | "quarter" | "year" = "month", range: FinanceRange = {}) =>
    downloadApiFile(
      `/api/admin/finance/accounting.xlsx`,
      { period, ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) },
      `roomeasy-accounting-${period}.xlsx`,
    ),
  downloadInvoicePdf: (bookingId: string) =>
    downloadApiFile(`/api/admin/finance/invoice/${encodeURIComponent(bookingId)}/pdf`, {}, `invoice-${bookingId}.pdf`),
};

/** Downloads a file from the server with the signed-in user's token. */
export async function downloadApiFile(path: string, params: Record<string, string>, filename: string): Promise<void> {
  const token = getAccessToken();
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(`${API_BASE_URL}${path}`, base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!response.ok) throw new Error("download failed");
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
