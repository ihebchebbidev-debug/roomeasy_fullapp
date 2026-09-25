import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminT } from "@/i18n/adminAutoCopy";
import { LISTING_REJECTION_REASONS, type ListingRejectionCode } from "@/lib/listingRejectionReasons";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingName?: string | undefined;
  onConfirm: (code: ListingRejectionCode, details?: string) => Promise<void> | void;
};

/** Asks the moderator for a reason before a listing is refused. */
export function RejectListingDialog({ open, onOpenChange, listingName, onConfirm }: Props) {
  const T = useAdminT();
  const [code, setCode] = useState<ListingRejectionCode | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const needsDetails = code === "other";
  const canSubmit = !!code && (!needsDetails || details.trim().length >= 5) && !busy;

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setCode(null);
      setDetails("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{T("Reject this listing")}</DialogTitle>
          <DialogDescription>
            {listingName ? <strong className="text-foreground">{listingName}</strong> : null}
            {listingName ? " — " : null}
            {T("The host will receive this reason and can fix the listing.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2" role="radiogroup" aria-label={T("Reason")}>
          <Label>{T("Reason")}</Label>
          {LISTING_REJECTION_REASONS.map((reason) => (
            <button
              key={reason.code}
              type="button"
              role="radio"
              aria-checked={code === reason.code}
              onClick={() => setCode(reason.code)}
              className={cn(
                "block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                code === reason.code ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted/50",
              )}
            >
              {T(reason.label)}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reject-details">{T("Details for the host")}</Label>
          <Textarea
            id="reject-details"
            rows={3}
            value={details}
            placeholder={needsDetails ? T("Required for “Other reason”") : T("Optional")}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)}>{T("Cancel")}</Button>
          <Button
            variant="destructive"
            disabled={!canSubmit}
            onClick={async () => {
              if (!code) return;
              setBusy(true);
              try {
                await onConfirm(code, details.trim() || undefined);
                close(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {T("Reject listing")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
