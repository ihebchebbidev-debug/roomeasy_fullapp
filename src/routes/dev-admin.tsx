import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { backendEnabled, remote } from "@/api/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { devAdminCopy, useDevAdminCopy } from "@/i18n/devAdminCopy";
import { localeOf } from "@/lib/seo";

/**
 * Hidden testing screen (not linked from anywhere, not indexed): creates an
 * administrator on the connected server and signs straight in, so the whole
 * back office can be tried end to end.
 */
export const Route = createFileRoute("/dev-admin")({
  head: ({ match }) => ({
    meta: [
      { title: devAdminCopy[localeOf(match) ?? "en"].title },
      { name: "description", content: devAdminCopy[localeOf(match) ?? "en"].description },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DevAdminPage,
});

function DevAdminPage() {
  const c = useDevAdminCopy();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  if (import.meta.env.PROD) {
    return <main className="grid min-h-screen place-items-center bg-background px-4"><p className="text-sm text-muted-foreground">{c.notFound}</p></main>;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!backendEnabled) {
      toast.error(c.noServer);
      return;
    }
    setBusy(true);
    try {
      const { request } = await import("@/api/http/client");
      await request("/accounts/dev/admin", { method: "POST", body: { fullName, email, password },
        headers: { "x-dev-admin-secret": secret },
      });
      const session = await remote.signIn(email, password);
      if (!session) return;
      toast.success(c.ready);
      await navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : c.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border bg-background p-8 shadow-sm">
        <span className="grid size-11 place-items-center rounded-2xl bg-lime text-lime-foreground">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{c.heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {c.intro}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dev-name">{c.name}</Label>
            <Input id="dev-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-email">{c.email}</Label>
            <Input id="dev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-password">{c.password}</Label>
            <Input
              id="dev-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-secret">{c.secret}</Label>
            <Input id="dev-secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {c.submit}
          </Button>
        </form>
      </div>
    </main>
  );
}
