import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { remote } from "@/api/backend";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Turns two-step sign-in on (scan/enter the key, confirm with a code) or off
 * (confirm with a current code). Nothing changes until the server accepts.
 */
export function TwoFactorDialog({
  open,
  mode,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  mode: "enable" | "disable";
  onOpenChange: (open: boolean) => void;
  onDone: (enabled: boolean) => void;
}) {
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setSetup(null);
      setCode("");
      return;
    }
    if (mode === "enable") void remote.startTwoFactor().then((value) => value && setSetup(value));
  }, [open, mode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const accepted = mode === "enable" ? await remote.enableTwoFactor(code) : await remote.disableTwoFactor(code);
    setBusy(false);
    if (!accepted) return;
    onDone(mode === "enable");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "enable" ? "Turn on two-step sign-in" : "Turn off two-step sign-in"}</DialogTitle>
          <DialogDescription>
            {mode === "enable"
              ? "Add RoomEasy to an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code it shows."
              : "Enter the current 6-digit code from your authenticator app to confirm."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {mode === "enable" ? (
            setup ? (
              <div className="space-y-3 text-center">
                <a href={setup.otpauthUrl} className="text-sm font-semibold text-primary underline underline-offset-4">
                  Open in my authenticator app
                </a>
                <p className="text-xs text-muted-foreground">Or add an account manually with this key:</p>
                <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">{setup.secret}</code>
              </div>
            ) : (
              <div className="grid place-items-center py-6">
                <Loader2 className="size-5 animate-spin" aria-hidden />
              </div>
            )
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="twofa-code">6-digit code</Label>
            <Input
              id="twofa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={busy || code.length !== 6 || (mode === "enable" && !setup)}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Confirm
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
