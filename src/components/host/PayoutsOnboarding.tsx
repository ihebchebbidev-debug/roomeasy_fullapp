/**
 * Stripe Connect (Express) onboarding for hosts.
 *
 * Real flow: the backend creates the connected account, hands back a hosted
 * onboarding link, and reports verification progress. Payments are then split
 * automatically at checkout — the platform commission stays with RoomEasy and
 * the rest goes straight to the host's account.
 *
 * When the payment keys are not configured the panel says so plainly; it never
 * claims payouts are active without the payment partner confirming it.
 */
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { paymentsApi, type ConnectStatusDto } from "@/api/http/payments.http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setPlatform } from "@/hooks/usePlatform";
import { useLanguage } from "@/i18n/LanguageProvider";

type Copy = {
  title: string;
  body: string;
  start: string;
  resume: string;
  ready: string;
  readyBody: string;
  pending: string;
  pendingBody: string;
  missing: string;
  dashboard: string;
  refresh: string;
  failed: string;
  returned: string;
  offline: string;
  country: string;
};

const COPY: Record<string, Copy> = {
  en: {
    title: "Payout account",
    body: "Verify your identity and bank details with our payment partner. Once verified, each booking is split automatically: our commission stays with RoomEasy and your share is paid straight to you.",
    start: "Set up payouts",
    resume: "Finish verification",
    ready: "Payouts active",
    readyBody: "Your account is verified. Your share of every booking is transferred automatically.",
    pending: "Verification in progress",
    pendingBody: "Our payment partner still needs a few details before payouts can be released.",
    missing: "Still required",
    dashboard: "Open my payout dashboard",
    refresh: "Refresh status",
    failed: "We could not reach the payment service. Please try again.",
    returned: "Thanks! We are checking your details with our payment partner.",
    offline: "Online payments are not configured on this environment yet.",
    country: "Country of your bank account",
  },
  fr: {
    title: "Compte de versement",
    body: "Vérifiez votre identité et vos coordonnées bancaires auprès de notre partenaire de paiement. Une fois vérifié, chaque réservation est répartie automatiquement : notre commission reste chez RoomEasy et votre part vous est versée directement.",
    start: "Configurer mes versements",
    resume: "Terminer la vérification",
    ready: "Versements actifs",
    readyBody: "Votre compte est vérifié. Votre part de chaque réservation vous est transférée automatiquement.",
    pending: "Vérification en cours",
    pendingBody: "Notre partenaire de paiement a encore besoin de quelques informations avant de débloquer les versements.",
    missing: "Encore nécessaire",
    dashboard: "Ouvrir mon tableau de bord des versements",
    refresh: "Actualiser le statut",
    failed: "Impossible de joindre le service de paiement. Réessayez.",
    returned: "Merci ! Nous vérifions vos informations auprès de notre partenaire de paiement.",
    offline: "Le paiement en ligne n’est pas encore configuré sur cet environnement.",
    country: "Pays de votre compte bancaire",
  },
  es: {
    title: "Cuenta de pagos",
    body: "Verifica tu identidad y tus datos bancarios con nuestro socio de pagos. Una vez verificada, cada reserva se reparte automáticamente.",
    start: "Configurar mis pagos",
    resume: "Terminar la verificación",
    ready: "Pagos activos",
    readyBody: "Tu cuenta está verificada. Tu parte de cada reserva se transfiere automáticamente.",
    pending: "Verificación en curso",
    pendingBody: "Nuestro socio de pagos aún necesita algunos datos.",
    missing: "Aún necesario",
    dashboard: "Abrir mi panel de pagos",
    refresh: "Actualizar estado",
    failed: "No pudimos contactar con el servicio de pagos. Inténtalo de nuevo.",
    returned: "¡Gracias! Estamos comprobando tus datos.",
    offline: "Los pagos en línea aún no están configurados.",
    country: "País de tu cuenta bancaria",
  },
  de: {
    title: "Auszahlungskonto",
    body: "Bestätigen Sie Ihre Identität und Bankdaten bei unserem Zahlungspartner. Danach wird jede Buchung automatisch aufgeteilt.",
    start: "Auszahlungen einrichten",
    resume: "Verifizierung abschließen",
    ready: "Auszahlungen aktiv",
    readyBody: "Ihr Konto ist verifiziert. Ihr Anteil jeder Buchung wird automatisch überwiesen.",
    pending: "Verifizierung läuft",
    pendingBody: "Unser Zahlungspartner benötigt noch einige Angaben.",
    missing: "Noch erforderlich",
    dashboard: "Mein Auszahlungs-Dashboard öffnen",
    refresh: "Status aktualisieren",
    failed: "Der Zahlungsdienst ist nicht erreichbar. Bitte erneut versuchen.",
    returned: "Danke! Wir prüfen Ihre Angaben.",
    offline: "Online-Zahlungen sind hier noch nicht konfiguriert.",
    country: "Land Ihres Bankkontos",
  },
  pt: {
    title: "Conta de pagamentos",
    body: "Verifique a sua identidade e os seus dados bancários junto do nosso parceiro de pagamentos. Depois, cada reserva é repartida automaticamente.",
    start: "Configurar pagamentos",
    resume: "Concluir verificação",
    ready: "Pagamentos ativos",
    readyBody: "A sua conta está verificada. A sua parte de cada reserva é transferida automaticamente.",
    pending: "Verificação em curso",
    pendingBody: "O nosso parceiro de pagamentos ainda precisa de alguns dados.",
    missing: "Ainda necessário",
    dashboard: "Abrir o meu painel de pagamentos",
    refresh: "Atualizar estado",
    failed: "Não foi possível contactar o serviço de pagamentos. Tente novamente.",
    returned: "Obrigado! Estamos a verificar os seus dados.",
    offline: "Os pagamentos online ainda não estão configurados.",
    country: "País da sua conta bancária",
  },
};

/**
 * Countries a host can hold their payout account in. France is the default —
 * the platform is French — but a host based elsewhere can change it before the
 * account is created (the country is fixed afterwards).
 */
const PAYOUT_COUNTRIES: { code: string; label: string }[] = [
  { code: "FR", label: "France" },
  { code: "BE", label: "Belgique / België" },
  { code: "CH", label: "Suisse / Schweiz" },
  { code: "LU", label: "Luxembourg" },
  { code: "ES", label: "España" },
  { code: "IT", label: "Italia" },
  { code: "DE", label: "Deutschland" },
  { code: "PT", label: "Portugal" },
  { code: "NL", label: "Nederland" },
  { code: "IE", label: "Ireland" },
  { code: "GB", label: "United Kingdom" },
];

export function PayoutsOnboarding({ returned }: { returned?: boolean }) {
  const { locale } = useLanguage();
  const c = COPY[locale] ?? COPY["en"]!;

  const [status, setStatus] = useState<ConnectStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [country, setCountry] = useState("FR");

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const next = await paymentsApi.connectStatus();
      setStatus(next);
      // Keep the local store in step so the rest of the dashboard agrees.
      setPlatform({ stripeOnboarded: next.payoutsEnabled && next.detailsSubmitted });
    } catch {
      setStatus(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Coming back from the hosted onboarding: re-read the verification state.
  useEffect(() => {
    if (!returned) return;
    toast.success(c.returned);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returned]);

  async function startOnboarding() {
    setBusy(true);
    try {
      const link = await paymentsApi.onboardingLink(country);
      window.location.href = link.url;
    } catch {
      toast.error(c.failed);
      setBusy(false);
    }
  }

  async function openDashboard() {
    setBusy(true);
    try {
      const link = await paymentsApi.dashboardLink();
      window.open(link.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {c.title}
      </div>
    );
  }

  // Payments not configured (or unreachable): say so honestly. No local toggle
  // may claim payouts are active — only the payment partner can confirm that.
  if (failed || !status?.enabled) {
    return (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <p className="font-semibold">{c.title}</p>
          <p className="text-xs text-muted-foreground">{failed ? c.failed : c.offline}</p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void load()}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
          {c.refresh}
        </Button>
      </div>
    );
  }

  const ready = status.payoutsEnabled && status.detailsSubmitted;
  const started = Boolean(status.accountId);
  const requirements = status.requirements ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{c.title}</p>
            {ready ? (
              <Badge className="border-0 bg-emerald-500/15 text-emerald-700">
                <CheckCircle2 className="mr-1 size-3" aria-hidden />
                {c.ready}
              </Badge>
            ) : started ? (
              <Badge className="border-0 bg-amber-500/15 text-amber-700">
                <AlertTriangle className="mr-1 size-3" aria-hidden />
                {c.pending}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {ready ? c.readyBody : started ? c.pendingBody : c.body}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!started && !ready ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{c.country}</span>
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
              >
                {PAYOUT_COUNTRIES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {ready ? (
            <Button variant="outline" onClick={() => void openDashboard()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : <ExternalLink className="mr-2 size-4" aria-hidden />}
              {c.dashboard}
            </Button>
          ) : (
            <Button onClick={() => void startOnboarding()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : <ShieldCheck className="mr-2 size-4" aria-hidden />}
              {started ? c.resume : c.start}
            </Button>
          )}
          <Button variant="ghost" onClick={() => void load()} disabled={busy}>
            {c.refresh}
          </Button>
        </div>
      </div>

      {!ready && requirements.length > 0 ? (
        <div className="rounded-xl bg-secondary/60 p-3">
          <p className="text-xs font-semibold">{c.missing}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
            {requirements.slice(0, 6).map((item) => (
              <li key={item}>{item.replace(/[._]/g, " ")}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
