import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { backendEnabled, remote } from "@/api/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Hidden testing screen (not linked from anywhere, not indexed): creates an
 * administrator on the connected server and signs straight in, so the whole
 * back office can be tried end to end.
 */
export const Route = createFileRoute("/dev-admin")({
  head: () => ({
    meta: [
      { title: "Internal admin setup — RoomEasy" },
      { name: "description", content: "Internal-only screen used to create a test administrator." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DevAdminPage,
});

function DevAdminPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (import.meta.env.PROD) {
    return <main className="grid min-h-screen place-items-center bg-background px-4"><p className="text-sm text-muted-foreground">Not found.</p></main>;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!backendEnabled) {
      toast.error("No server address is configured, so no account can be created.");
      return;
    }
    setBusy(true);
    try {
      const { request } = await import("@/api/http/client");
      await request("/accounts/dev/admin", { method: "POST", body: { fullName, email, password } });
      const session = await remote.signIn(email, password);
      if (!session) return;
      toast.success("Administrator ready — opening the back office.");
      await navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The administrator could not be created.");
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
        <h1 className="mt-4 text-2xl font-bold">Create a test administrator</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Internal screen. It creates the account on the connected server (or promotes an existing
          one), signs you in and opens the back office. Unavailable in production.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dev-name">Full name</Label>
            <Input id="dev-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-email">Email</Label>
            <Input id="dev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dev-password">Password</Label>
            <Input
              id="dev-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Create administrator and open the back office
          </Button>
        </form>
      </div>
    </main>
  );
}
