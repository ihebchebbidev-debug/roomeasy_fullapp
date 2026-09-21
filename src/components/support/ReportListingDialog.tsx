import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { supportApi, type ReportReason } from "@/api/http/support.http";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupportCopy } from "@/i18n/supportCopy";

/** Lets a signed-in member flag a listing; the report lands in moderation. */
export function ReportListingDialog({ listingId }: { listingId: string }) {
  const c = useSupportCopy();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("wrong_information");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const reasons: { value: ReportReason; label: string }[] = [
    { value: "fraud", label: c.reasonFraud },
    { value: "inappropriate", label: c.reasonInappropriate },
    { value: "wrong_information", label: c.reasonWrongInformation },
    { value: "unavailable", label: c.reasonUnavailable },
    { value: "safety", label: c.reasonSafety },
    { value: "other", label: c.reasonOther },
  ];

  async function submit() {
    setBusy(true);
    try {
      await supportApi.reportListing({
        listingId,
        reason,
        ...(details.trim() ? { details: details.trim() } : {}),
      });
      toast.success(c.reportSent);
      setDetails("");
      setOpen(false);
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="mr-2 size-4" aria-hidden />
          {c.reportListing}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{c.reportTitle}</DialogTitle>
          <DialogDescription>{c.reportHint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">{c.reportReason}</Label>
            <select
              id="report-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {reasons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">{c.reportDetails}</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={c.reportDetailsPlaceholder}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {c.cancel}
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {c.reportSend}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
