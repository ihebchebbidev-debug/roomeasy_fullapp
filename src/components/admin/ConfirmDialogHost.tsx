import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminT } from "@/i18n/adminAutoCopy";

type Request = { title: string; description?: string | undefined; confirmLabel?: string | undefined; resolve: (ok: boolean) => void };

let push: ((r: Request) => void) | null = null;

/** Ask the admin to confirm before a sensitive action runs. Resolves true when confirmed. */
export function confirmAction(title: string, description?: string, confirmLabel?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!push) return resolve(true);
    push({ title, description, confirmLabel, resolve });
  });
}

/** Mounted once in the admin page; renders the shared confirmation box. */
export function ConfirmDialogHost() {
  const T = useAdminT();
  const [req, setReq] = useState<Request | null>(null);
  useEffect(() => {
    push = setReq;
    return () => {
      push = null;
    };
  }, []);
  const close = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };
  return (
    <AlertDialog open={req !== null} onOpenChange={(open) => { if (!open) close(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{req ? T(req.title) : null}</AlertDialogTitle>
          {req?.description ? <AlertDialogDescription>{T(req.description)}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>{T("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => close(true)}>{T(req?.confirmLabel ?? "Confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
