import { ListToolbar, ShowMore, rowText, useListControls } from "@/components/admin/ListControls";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { adminTeamApi, type AdminMemberRow, type GrantableRole } from "@/api/http/support.http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useSupportCopy } from "@/i18n/supportCopy";

/** Hands out and removes back-office access levels (multi-level admin roles). */
export function TeamRolesPanel() {
  const c = useSupportCopy();
  const [rows, setRows] = useState<AdminMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState("");

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setSearched(term.trim());
    try {
      setRows(term.trim() ? await adminTeamApi.members(term.trim()) : await adminTeamApi.staff());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  // Only staff (admin, moderator, support, accounting) are listed; searching
  // also shows other members so a new person can be given access.
  const STAFF = ["admin", "moderator", "support", "accounting"];
  const visible = searched ? rows : rows.filter((r) => r.roles.some((role) => STAFF.includes(role)));

  const roleOptions: { role: GrantableRole; label: string }[] = [
    { role: "admin", label: c.roleAdmin },
    { role: "moderator", label: c.roleModerator },
    { role: "support", label: c.roleSupport },
    { role: "accounting", label: c.roleAccounting },
    { role: "host", label: c.roleHost },
  ];
  const list = useListControls(visible, {
    text: rowText,
    filters: roleOptions
      .filter(({ role }) => STAFF.includes(role))
      .map(({ role, label }) => ({ value: role, label, test: (row) => row.roles.includes(role) })),
  });

  async function toggle(row: AdminMemberRow, role: GrantableRole, has: boolean) {
    try {
      const result = has ? await adminTeamApi.revokeRole(row.id, role) : await adminTeamApi.grantRole(row.id, role);
      if (has && result && result.removed === false) {
        toast.error(result.message ?? c.failed);
        return;
      }
      toast.success(has ? c.revoked : c.granted);
      await load(searched);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : c.failed);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold">{c.teamTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.teamHint}</p>
      </div>

      <ListToolbar
        controls={list}
        placeholder={c.searchMember}
        extra={
          <Button type="button" variant="outline" onClick={() => void load(list.query)} disabled={loading}>
            {c.refresh}
          </Button>
        }
      />

      {loading ? <p className="border-y border-border py-6 text-center text-sm text-muted-foreground">{c.loading}</p> : null}
      {!loading && list.total === 0 ? <p className="border-y border-border py-6 text-center text-sm text-muted-foreground">{c.empty}</p> : null}

      {!loading && list.total > 0 ? (
        <div className="divide-y divide-border border-y border-border">
          {list.visible.map((row) => (
          <div key={row.id} className="p-4 transition-colors hover:bg-muted/30 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  name={row.fullName}
                  src={null}
                  className="size-11 shrink-0 text-base"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">{row.email}</p>
                  <p className="text-xs text-muted-foreground">{row.joinedOn}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {row.suspended ? <Badge variant="secondary">{c.suspendedBadge}</Badge> : null}
                {row.banned ? <Badge variant="destructive">{c.bannedBadge}</Badge> : null}
                {row.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.roles}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {roleOptions.map((option) => {
                const has = row.roles.includes(option.role);
                return (
                  <Button
                    key={option.role}
                    size="sm"
                    variant={has ? "secondary" : "outline"}
                    onClick={() => void toggle(row, option.role, has)}
                  >
                    {option.label} · {has ? c.revoke : c.grant}
                  </Button>
                );
              })}
            </div>
          </div>
          ))}
        </div>
      ) : null}
      <ShowMore controls={list} />
    </div>
  );
}
