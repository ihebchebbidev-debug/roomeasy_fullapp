import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/api/types";
import { reviewsApi } from "@/api/http/platform.http";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";

type Reason = "abusive" | "false" | "off_topic" | "personal_data" | "other";

const COPY = {
  en: { report: "Report", title: "Report this review", details: "Details (optional)", send: "Send report", sent: "Thanks — our team will review it.", signIn: "Sign in to report a review.", fail: "The report could not be sent.", reasons: { abusive: "Offensive or abusive", false: "False or misleading", off_topic: "Not about this stay", personal_data: "Contains personal information", other: "Other" } },
  fr: { report: "Signaler", title: "Signaler cet avis", details: "Précisions (facultatif)", send: "Envoyer le signalement", sent: "Merci — notre équipe va l'examiner.", signIn: "Connectez-vous pour signaler un avis.", fail: "Le signalement n'a pas pu être envoyé.", reasons: { abusive: "Injurieux ou offensant", false: "Faux ou trompeur", off_topic: "Sans rapport avec ce séjour", personal_data: "Contient des données personnelles", other: "Autre" } },
  es: { report: "Denunciar", title: "Denunciar esta reseña", details: "Detalles (opcional)", send: "Enviar denuncia", sent: "Gracias, nuestro equipo la revisará.", signIn: "Inicia sesión para denunciar una reseña.", fail: "No se pudo enviar la denuncia.", reasons: { abusive: "Ofensiva o abusiva", false: "Falsa o engañosa", off_topic: "No trata de esta estancia", personal_data: "Contiene datos personales", other: "Otro" } },
  de: { report: "Melden", title: "Diese Bewertung melden", details: "Details (optional)", send: "Meldung senden", sent: "Danke – unser Team prüft sie.", signIn: "Melde dich an, um eine Bewertung zu melden.", fail: "Die Meldung konnte nicht gesendet werden.", reasons: { abusive: "Beleidigend", false: "Falsch oder irreführend", off_topic: "Nicht zu diesem Aufenthalt", personal_data: "Enthält persönliche Daten", other: "Sonstiges" } },
  pt: { report: "Denunciar", title: "Denunciar esta avaliação", details: "Detalhes (opcional)", send: "Enviar denúncia", sent: "Obrigado — a nossa equipa vai analisá-la.", signIn: "Inicie sessão para denunciar uma avaliação.", fail: "Não foi possível enviar a denúncia.", reasons: { abusive: "Ofensiva ou abusiva", false: "Falsa ou enganosa", off_topic: "Não é sobre esta estadia", personal_data: "Contém dados pessoais", other: "Outro" } },
} as const;

export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const { locale } = useLanguage();
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("abusive");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await reviewsApi.report(reviewId, { reason, ...(details.trim() ? { details: details.trim() } : {}) });
      toast.success(c.sent);
      setOpen(false);
      setDetails("");
    } catch (error) {
      toast.error(error instanceof ApiError && (error.details as { status?: number } | undefined)?.status === 401 ? c.signIn : c.fail);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-muted-foreground">
          <Flag className="size-3" aria-hidden />
          {c.report}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2" role="radiogroup">
          {(Object.keys(c.reasons) as Reason[]).map((key) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="review-report" checked={reason === key} onChange={() => setReason(key)} />
              {c.reasons[key]}
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`rr-${reviewId}`}>{c.details}</Label>
          <Textarea id={`rr-${reviewId}`} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} />
        </div>
        <DialogFooter>
          <Button onClick={() => void send()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {c.send}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
