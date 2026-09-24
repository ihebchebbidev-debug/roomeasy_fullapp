/**
 * Member side of the support desk (open a request, reply, report a listing)
 * and the administrator team screen (hand out back-office access levels).
 */
import { request } from "@/api/http/client";

export type MemberTicketMessage = {
  id: string;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  body: string;
  internalNote: boolean;
  sentAt: string;
};

export type MemberTicket = {
  id: string;
  reference: string;
  subject: string;
  category: "booking" | "payment" | "listing" | "account" | "dispute" | "other";
  status: "open" | "pending" | "resolved" | "closed";
  resolution: string | null;
  lastActivityAt: string;
  createdAt: string;
  messages?: MemberTicketMessage[];
};

export type ReportReason =
  | "fraud"
  | "inappropriate"
  | "wrong_information"
  | "unavailable"
  | "safety"
  | "other";

export const supportApi = {
  myTickets: () => request<MemberTicket[]>("/support/tickets", { query: { limit: 50 } }),
  ticket: (ticketId: string) => request<MemberTicket>(`/support/tickets/${encodeURIComponent(ticketId)}`),
  openTicket: (input: {
    subject: string;
    category: MemberTicket["category"];
    body: string;
    bookingId?: string;
    listingId?: string;
  }) => request<MemberTicket>("/support/tickets", { method: "POST", body: input }),
  reply: (ticketId: string, body: string) =>
    request<MemberTicket>(`/support/tickets/${encodeURIComponent(ticketId)}/messages`, {
      method: "POST",
      body: { body },
    }),
  reportListing: (input: { listingId: string; reason: ReportReason; details?: string }) =>
    request<unknown>("/support/reports", { method: "POST", body: input }),
};

export type AdminMemberRow = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  verified: boolean;
  suspended: boolean;
  banned?: boolean;
  joinedOn: string;
};

export type GrantableRole = "host" | "admin" | "moderator" | "support" | "accounting";

export const adminTeamApi = {
  members: (search?: string, role?: string) =>
    request<AdminMemberRow[]>("/admin/users", {
      query: { limit: search ? 30 : 100, ...(search ? { search } : {}), ...(role ? { role } : {}) },
    }),
  /** Everyone holding a back-office role, merged and de-duplicated. */
  staff: async () => {
    const lists = await Promise.all(
      ["admin", "moderator", "support", "accounting"].map((role) =>
        request<AdminMemberRow[]>("/admin/users", { query: { limit: 100, role } }),
      ),
    );
    const byId = new Map<string, AdminMemberRow>();
    lists.flat().forEach((row) => byId.set(row.id, row));
    return [...byId.values()];
  },
  grantRole: (userId: string, role: GrantableRole) =>
    request<{ removed?: boolean; message?: string }>(`/admin/users/${encodeURIComponent(userId)}/roles`, { method: "POST", body: { role } }),
  revokeRole: (userId: string, role: GrantableRole) =>
    request<{ removed?: boolean; message?: string }>(
      `/admin/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(role)}`,
      { method: "DELETE" },
    ),
};
