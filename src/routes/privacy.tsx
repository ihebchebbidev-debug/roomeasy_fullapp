import { CmsOrFallback } from "@/components/legal/CmsPage";
import { createFileRoute } from "@tanstack/react-router";
import { canonical, localeOf, publicPageMeta } from "@/lib/seo";

import { AppShell } from "@/components/layout/AppShell";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/privacy")({
  head: ({ match }) => ({
    meta: publicPageMeta({
      locale: localeOf(match),
      title: "Politique de confidentialité — RoomEasy",
      description:
        "Comment RoomEasy collecte, utilise et protège vos données personnelles lors des réservations, de la mise en location et des paiements.",
      path: "/privacy",
      type: "article",
    }),
    links: canonical("/privacy", localeOf(match)),
  }),
  component: () => (
    <CmsOrFallback slug="privacy">
      <PrivacyPage />
    </CmsOrFallback>
  ),
});

const sectionsByLocale = {
  en: [
    ["Data we collect", "Account details, booking history, messages exchanged on the platform and payment metadata handled by our payment partner."],
    ["How we use it", "To operate bookings, prevent fraud, provide support, remember your language and currency, and improve the service."],
    ["Sharing", "We share only what is necessary with hosts, guests and processors such as our payment and email providers."],
    ["Your rights", "You may access, correct, export or delete your data, and object to marketing at any time."],
    ["Contact", "Write to privacy@roomeasy.com and we will respond within 30 days."],
  ],
  fr: [
    ["Données collectées", "Informations de compte, historique de réservation, messages échangés sur la plateforme et métadonnées de paiement traitées par notre prestataire."],
    ["Utilisation", "Gérer les réservations, prévenir la fraude, assurer le support, mémoriser votre langue et votre devise, et améliorer le service."],
    ["Partage", "Nous ne partageons que le nécessaire avec les hôtes, les voyageurs et nos prestataires de paiement et d'e-mail."],
    ["Vos droits", "Vous pouvez accéder à vos données, les corriger, les exporter ou les supprimer, et refuser le marketing à tout moment."],
    ["Contact", "Écrivez à privacy@roomeasy.com : nous répondons sous 30 jours."],
  ],
  es: [
    ["Datos que recogemos", "Datos de la cuenta, historial de reservas, mensajes intercambiados en la plataforma y metadatos de pago gestionados por nuestro proveedor."],
    ["Cómo los usamos", "Para gestionar reservas, prevenir el fraude, dar soporte, recordar tu idioma y moneda y mejorar el servicio."],
    ["Compartir", "Solo compartimos lo necesario con anfitriones, huéspedes y proveedores de pago y de correo electrónico."],
    ["Tus derechos", "Puedes acceder, corregir, exportar o eliminar tus datos y oponerte al marketing en cualquier momento."],
    ["Contacto", "Escribe a privacy@roomeasy.com y responderemos en un plazo de 30 días."],
  ],
  de: [
    ["Erhobene Daten", "Kontodaten, Buchungsverlauf, Nachrichten auf der Plattform und Zahlungs-Metadaten, die unser Zahlungspartner verarbeitet."],
    ["Verwendung", "Für Buchungen, Betrugsprävention, Support, das Speichern von Sprache und Währung sowie zur Verbesserung des Angebots."],
    ["Weitergabe", "Wir geben nur das Notwendige an Gastgeber, Gäste und Dienstleister wie Zahlungs- und E-Mail-Anbieter weiter."],
    ["Deine Rechte", "Du kannst deine Daten einsehen, korrigieren, exportieren oder löschen und Werbung jederzeit widersprechen."],
    ["Kontakt", "Schreib an privacy@roomeasy.com – wir antworten innerhalb von 30 Tagen."],
  ],
  pt: [
    ["Dados que recolhemos", "Dados da conta, histórico de reservas, mensagens trocadas na plataforma e metadados de pagamento tratados pelo nosso parceiro."],
    ["Como os usamos", "Para gerir reservas, prevenir fraude, dar apoio, guardar o seu idioma e moeda e melhorar o serviço."],
    ["Partilha", "Partilhamos apenas o necessário com anfitriões, hóspedes e fornecedores de pagamento e de email."],
    ["Os seus direitos", "Pode acessar, corrigir, exportar ou apagar os seus dados e recusar marketing em qualquer momento."],
    ["Contacto", "Escreva para privacy@roomeasy.com e responderemos em 30 dias."],
  ],
} as const;

function PrivacyPage() {
  const { t, locale } = useLanguage();
  const sections = pickCopy(locale, sectionsByLocale);
  return (
    <AppShell title={t.app.legal.privacy} subtitle={`${t.app.legal.updated}: 2026-09-01`}>
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
