import { CmsOrFallback } from "@/components/legal/CmsPage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { canonical, localeOf, KEYWORDS, publicPageMeta } from "@/lib/seo";
import { LifeBuoy, Mail, MessageSquare, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSupportCopy } from "@/i18n/supportCopy";

export const Route = createFileRoute("/help")({
  head: ({ match }) => ({
    meta: publicPageMeta({
      locale: localeOf(match),
      title: "Centre d'aide RoomEasy — réservations, annulations et remboursements",
      description:
        "Toutes les réponses sur les réservations, annulations, remboursements, versements aux hôtes et la mise en ligne d'un logement, plus comment joindre notre support.",
      path: "/help",
      keywords: KEYWORDS.help,
    }),
    links: canonical("/help", localeOf(match)),
  }),
  component: () => (
    <CmsOrFallback slug="help">
      <HelpPage />
    </CmsOrFallback>
  ),
});

const content = {
  en: {
    title: "Help centre",
    subtitle: "Answers to the questions guests and hosts ask us most.",
    contact: "Still need a hand?",
    contactText: "Our team replies within a few hours, every day of the week.",
    email: "Email support",
    chat: "Open messages",
    trust: "RoomEasy verifies every host and protects payments end to end.",
    faqs: [
      ["How do I book a stay?", "Search a destination, pick your dates and guests, open a listing and confirm on the checkout page. You get an instant confirmation and the booking appears under Trips."],
      ["Can I cancel and get a refund?", "Yes. Cancel from Trips: bookings cancelled more than 48 hours before check-in are refunded in full, later cancellations are refunded minus the first night."],
      ["Are the prices final?", "The nightly rate, cleaning fee, service fee and taxes are always shown before you pay. No surprise charges at check-in."],
      ["How do hosts get paid?", "Payouts are released 24 hours after check-in and tracked in the host dashboard, minus the platform commission."],
      ["How do I publish my place?", "Use List your place: four steps for the basics, your space, photos and pricing. You can save a draft and publish later."],
      ["Is my payment secure?", "Payments run through an encrypted provider and card details are never stored on RoomEasy."],
    ],
  },
  fr: {
    title: "Centre d'aide",
    subtitle: "Les réponses aux questions les plus fréquentes des voyageurs et des hôtes.",
    contact: "Besoin d'aide ?",
    contactText: "Notre équipe répond en quelques heures, tous les jours.",
    email: "Écrire au support",
    chat: "Ouvrir la messagerie",
    trust: "RoomEasy vérifie chaque hôte et protège les paiements de bout en bout.",
    faqs: [
      ["Comment réserver un séjour ?", "Recherchez une destination, choisissez vos dates et voyageurs, ouvrez l'annonce puis confirmez au paiement. La réservation apparaît ensuite dans Voyages."],
      ["Puis-je annuler et être remboursé ?", "Oui. Annulez depuis Voyages : plus de 48 h avant l'arrivée, le remboursement est intégral ; après, la première nuit est retenue."],
      ["Les prix sont-ils définitifs ?", "Le tarif par nuit, le ménage, les frais de service et les taxes sont affichés avant le paiement. Aucun frais surprise à l'arrivée."],
      ["Comment les hôtes sont-ils payés ?", "Les versements sont envoyés 24 h après l'arrivée et suivis dans le tableau de bord hôte, commission déduite."],
      ["Comment publier mon logement ?", "Utilisez Publier votre logement : quatre étapes pour les informations, l'espace, les photos et les tarifs. Vous pouvez enregistrer un brouillon."],
      ["Le paiement est-il sécurisé ?", "Les paiements passent par un prestataire chiffré et aucune donnée de carte n'est stockée par RoomEasy."],
    ],
  },
  es: {
    title: "Centro de ayuda",
    subtitle: "Respuestas a las preguntas más frecuentes de huéspedes y anfitriones.",
    contact: "¿Sigues necesitando ayuda?",
    contactText: "Nuestro equipo responde en pocas horas, todos los días.",
    email: "Escribir al soporte",
    chat: "Abrir mensajes",
    trust: "RoomEasy verifica a cada anfitrión y protege los pagos de principio a fin.",
    faqs: [
      ["¿Cómo reservo un alojamiento?", "Busca un destino, elige fechas y huéspedes, abre el anuncio y confirma en el pago. Recibes confirmación inmediata y la reserva aparece en Viajes."],
      ["¿Puedo cancelar y recibir un reembolso?", "Sí. Cancela desde Viajes: con más de 48 horas de antelación el reembolso es total; después se retiene la primera noche."],
      ["¿Los precios son definitivos?", "El precio por noche, la limpieza, los gastos de servicio y los impuestos se muestran antes de pagar. Sin sorpresas en la llegada."],
      ["¿Cómo cobran los anfitriones?", "Los pagos se liberan 24 horas después de la llegada y se siguen en el panel de anfitrión, menos la comisión."],
      ["¿Cómo publico mi alojamiento?", "Usa Publica tu alojamiento: cuatro pasos para los datos, el espacio, las fotos y los precios. Puedes guardar un borrador."],
      ["¿Es seguro el pago?", "Los pagos se procesan con un proveedor cifrado y RoomEasy nunca guarda los datos de la tarjeta."],
    ],
  },
  de: {
    title: "Hilfe-Center",
    subtitle: "Antworten auf die häufigsten Fragen von Gästen und Gastgebern.",
    contact: "Noch Fragen?",
    contactText: "Unser Team antwortet innerhalb weniger Stunden, an jedem Tag der Woche.",
    email: "Support schreiben",
    chat: "Nachrichten öffnen",
    trust: "RoomEasy prüft jeden Gastgeber und schützt Zahlungen durchgehend.",
    faqs: [
      ["Wie buche ich eine Unterkunft?", "Ziel suchen, Daten und Gäste wählen, Anzeige öffnen und beim Bezahlen bestätigen. Die Bestätigung kommt sofort, die Buchung erscheint unter Reisen."],
      ["Kann ich stornieren und Geld zurückbekommen?", "Ja. Storniere unter Reisen: mehr als 48 Stunden vor Anreise gibt es die volle Erstattung, danach wird die erste Nacht berechnet."],
      ["Sind die Preise endgültig?", "Übernachtungspreis, Reinigung, Servicegebühr und Steuern werden vor der Zahlung angezeigt. Keine Überraschungen bei der Anreise."],
      ["Wie werden Gastgeber bezahlt?", "Auszahlungen erfolgen 24 Stunden nach der Anreise, abzüglich Provision, und sind im Gastgeber-Dashboard einsehbar."],
      ["Wie veröffentliche ich meine Unterkunft?", "Über Unterkunft anbieten: vier Schritte für Basisdaten, Raum, Fotos und Preise. Ein Entwurf lässt sich speichern."],
      ["Ist meine Zahlung sicher?", "Zahlungen laufen über einen verschlüsselten Anbieter; Kartendaten werden bei RoomEasy nie gespeichert."],
    ],
  },
  pt: {
    title: "Centro de ajuda",
    subtitle: "Respostas às perguntas mais frequentes de hóspedes e anfitriões.",
    contact: "Ainda precisa de ajuda?",
    contactText: "A nossa equipa responde em poucas horas, todos os dias.",
    email: "Escrever ao suporte",
    chat: "Abrir mensagens",
    trust: "A RoomEasy verifica cada anfitrião e protege os pagamentos de ponta a ponta.",
    faqs: [
      ["Como reservo uma estadia?", "Procure um destino, escolha datas e hóspedes, abra o anúncio e confirme no pagamento. A reserva aparece em Viagens."],
      ["Posso cancelar e ser reembolsado?", "Sim. Cancele em Viagens: mais de 48 horas antes da chegada o reembolso é total; depois, retém-se a primeira noite."],
      ["Os preços são finais?", "O valor por noite, limpeza, taxa de serviço e impostos são mostrados antes do pagamento. Sem surpresas na chegada."],
      ["Como é que os anfitriões recebem?", "Os pagamentos são libertados 24 horas após a chegada e acompanhados no painel de anfitrião, menos a comissão."],
      ["Como publico o meu espaço?", "Use Publique o seu espaço: quatro passos para dados, espaço, fotos e preços. Pode guardar um rascunho."],
      ["O pagamento é seguro?", "Os pagamentos passam por um fornecedor encriptado e os dados do cartão nunca são guardados pela RoomEasy."],
    ],
  },
} as const;

function HelpPage() {
  const { t, locale } = useLanguage();
  const c = pickCopy(locale, content);
  const sc = useSupportCopy();

  return (
    <AppShell title={c.title} subtitle={c.subtitle}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <Accordion type="single" collapsible className="w-full">
            {c.faqs.map(([question, answer]) => (
              <AccordionItem key={question} value={question}>
                <AccordionTrigger className="text-left">{question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-sky-panel p-5">
            <LifeBuoy className="size-6 text-primary" aria-hidden />
            <h2 className="mt-3 font-display text-lg font-semibold">{c.contact}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.contactText}</p>
            <div className="mt-4 grid gap-2">
              <Button asChild className="rounded-full">
                <a href="mailto:hello@roomeasy.com">
                  <Mail className="size-4" aria-hidden />
                  {c.email}
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/support">
                  <LifeBuoy className="size-4" aria-hidden />
                  {sc.newRequest}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/messages">
                  <MessageSquare className="size-4" aria-hidden />
                  {c.chat}
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p>
              {c.trust}{" "}
              <Link to="/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">
                {t.app.legal.privacy}
              </Link>{" "}
              ·{" "}
              <Link to="/terms" className="font-medium text-foreground underline-offset-4 hover:underline">
                {t.app.legal.terms}
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
