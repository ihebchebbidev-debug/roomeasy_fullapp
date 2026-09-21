import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { adminTeamApi, type AdminMemberRow, type GrantableRole } from "@/api/http/support.http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupportCopy } from "@/i18n/supportCopy";

/** Hands out and removes back-office access levels (multi-level admin roles). */
export function TeamRolesPanel() {
  const c = useSupportCopy();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AdminMemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      setRows(await adminTeamApi.members(term.trim() || undefined));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  const roleOptions: { role: GrantableRole; label: string }[] = [
    { role: "admin", label: c.roleAdmin },
    { role: "moderator", label: c.roleModerator },
    { role: "support", label: c.roleSupport },
    { role: "accounting", label: c.roleAccounting },
    { role: "host", label: c.roleHost },
  ];

  async function toggle(row: AdminMemberRow, role: GrantableRole, has: boolean) {
    try {
      if (has) await adminTeamApi.revokeRole(row.id, role);
      else await adminTeamApi.grantRole(row.id, role);
      toast.success(has ? c.revoked : c.granted);
      await load(search);
    } catch {
      toast.error(c.failed);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">{c.teamTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.teamHint}</p>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void load(search);
          }}
        >
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={c.searchMember}
            className="max-w-sm"
          />
          <Button type="submit" variant="outline">
            {c.refresh}
          </Button>
        </form>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">{c.loading}</p> : null}
      {!loading && rows.length === 0 ? <p className="text-sm text-muted-foreground">{c.empty}</p> : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
        {rows.map((row) => (
          <div key={row.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{row.fullName}</p>
                <p className="text-sm text-muted-foreground">{row.email}</p>
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
    </div>
  );
}
