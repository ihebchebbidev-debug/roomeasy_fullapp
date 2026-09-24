import { CmsOrFallback } from "@/components/legal/CmsPage";
import { createFileRoute } from "@tanstack/react-router";
import { canonical, publicPageMeta } from "@/lib/seo";

import { AppShell } from "@/components/layout/AppShell";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: publicPageMeta({
      title: "Conditions générales d'utilisation — RoomEasy",
      description:
        "Les règles de réservation, d'hébergement, d'annulation et de paiement applicables sur RoomEasy.",
      path: "/terms",
      type: "article",
    }),
    links: canonical("/terms"),
  }),
  component: () => (
    <CmsOrFallback slug="terms">
      <TermsPage />
    </CmsOrFallback>
  ),
});

const sectionsByLocale = {
  en: [
    ["Using RoomEasy", "You must be 18 or older and provide accurate information. Accounts may be suspended for misuse."],
    ["Bookings", "A booking is confirmed once the host accepts and payment is authorised. Prices shown include applicable fees."],
    ["Cancellations", "Flexible stays can be cancelled free of charge up to 24 hours before check-in; refunds follow the listing policy."],
    ["Hosting", "Hosts are responsible for accurate listings, safe accommodation and honouring confirmed reservations."],
    ["Liability", "RoomEasy connects guests and hosts and is not a party to the rental agreement between them."],
  ],
  fr: [
    ["Utiliser RoomEasy", "Vous devez avoir 18 ans ou plus et fournir des informations exactes. Un compte peut être suspendu en cas d'abus."],
    ["Réservations", "Une réservation est confirmée dès l'acceptation de l'hôte et l'autorisation du paiement. Les prix affichés incluent les frais applicables."],
    ["Annulations", "Les séjours flexibles sont annulables sans frais jusqu'à 24 h avant l'arrivée ; les remboursements suivent la politique de l'annonce."],
    ["Hébergement", "Les hôtes sont responsables de l'exactitude des annonces, de la sécurité du logement et du respect des réservations confirmées."],
    ["Responsabilité", "RoomEasy met en relation voyageurs et hôtes et n'est pas partie au contrat de location."],
  ],
  es: [
    ["Uso de RoomEasy", "Debes tener 18 años o más y facilitar información veraz. Las cuentas pueden suspenderse por uso indebido."],
    ["Reservas", "Una reserva se confirma cuando el anfitrión la acepta y se autoriza el pago. Los precios mostrados incluyen las tarifas aplicables."],
    ["Cancelaciones", "Las estancias flexibles se cancelan sin coste hasta 24 horas antes de la llegada; los reembolsos siguen la política del anuncio."],
    ["Alojar", "Los anfitriones son responsables de anuncios precisos, alojamientos seguros y del cumplimiento de las reservas confirmadas."],
    ["Responsabilidad", "RoomEasy conecta a huéspedes y anfitriones y no es parte del contrato de alquiler entre ellos."],
  ],
  de: [
    ["Nutzung von RoomEasy", "Du musst mindestens 18 Jahre alt sein und korrekte Angaben machen. Konten können bei Missbrauch gesperrt werden."],
    ["Buchungen", "Eine Buchung ist bestätigt, sobald der Gastgeber zustimmt und die Zahlung autorisiert ist. Angezeigte Preise enthalten die anfallenden Gebühren."],
    ["Stornierungen", "Flexible Aufenthalte sind bis 24 Stunden vor Anreise kostenfrei stornierbar; Erstattungen folgen der Richtlinie der Anzeige."],
    ["Gastgeben", "Gastgeber sind für korrekte Anzeigen, sichere Unterkünfte und die Einhaltung bestätigter Buchungen verantwortlich."],
    ["Haftung", "RoomEasy verbindet Gäste und Gastgeber und ist nicht Partei des Mietvertrags zwischen ihnen."],
  ],
  pt: [
    ["Utilizar a RoomEasy", "Tem de ter 18 anos ou mais e fornecer informação correta. As contas podem ser suspensas por uso indevido."],
    ["Reservas", "Uma reserva é confirmada quando o anfitrião aceita e o pagamento é autorizado. Os preços mostrados incluem as taxas aplicáveis."],
    ["Cancelamentos", "Estadias flexíveis podem ser canceladas sem custo até 24 horas antes da chegada; os reembolsos seguem a política do anúncio."],
    ["Ser anfitrião", "Os anfitriões são responsáveis por anúncios corretos, alojamento seguro e por cumprir as reservas confirmadas."],
    ["Responsabilidade", "A RoomEasy liga hóspedes e anfitriões e não é parte do contrato de arrendamento entre eles."],
  ],
} as const;

function TermsPage() {
  const { t, locale } = useLanguage();
  const sections = pickCopy(locale, sectionsByLocale);
  return (
    <AppShell title={t.app.legal.terms} subtitle={`${t.app.legal.updated}: 2026-09-01`}>
      <div className="max-w-3xl space-y-8">
        {sections.map(([heading, body]) => (
          <section key={heading} className="space-y-2">
            <h2 className="font-display text-lg font-bold">{heading}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
