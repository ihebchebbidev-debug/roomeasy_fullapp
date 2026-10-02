import type { Locale } from "@/i18n/translations";

type Page = "stays" | "help" | "terms" | "privacy" | "host";
type Meta = { title: string; description: string };

export const pageMeta: Record<Page, Record<Locale, Meta>> = {
  stays: {
    en: { title: "Holiday rentals in France — RoomEasy", description: "Compare apartments, villas, chalets and guesthouses in France by city, dates, budget and amenities. Verified reviews and clear prices." },
    fr: { title: "Locations de vacances en France — RoomEasy", description: "Comparez appartements, villas, chalets et maisons d'hôtes en France : filtres par ville, dates, budget et équipements, avis vérifiés et prix tout compris." },
    es: { title: "Alquileres vacacionales en Francia — RoomEasy", description: "Compara apartamentos, villas, chalets y casas de huéspedes en Francia por ciudad, fechas, presupuesto y servicios. Opiniones verificadas y precios claros." },
    de: { title: "Ferienunterkünfte in Frankreich — RoomEasy", description: "Vergleichen Sie Apartments, Villen, Chalets und Gästehäuser in Frankreich nach Stadt, Reisedaten, Budget und Ausstattung. Verifizierte Bewertungen und klare Preise." },
    pt: { title: "Alojamentos de férias em França — RoomEasy", description: "Compare apartamentos, moradias, chalés e casas de hóspedes em França por cidade, datas, orçamento e comodidades. Avaliações verificadas e preços claros." },
  },
  help: {
    en: { title: "RoomEasy help centre — bookings, cancellations and refunds", description: "Find answers about bookings, cancellations, refunds, host payouts and publishing a listing, or contact our support team." },
    fr: { title: "Centre d'aide RoomEasy — réservations, annulations et remboursements", description: "Toutes les réponses sur les réservations, annulations, remboursements, versements aux hôtes et la mise en ligne d'un logement, plus comment joindre notre support." },
    es: { title: "Centro de ayuda RoomEasy — reservas, cancelaciones y reembolsos", description: "Respuestas sobre reservas, cancelaciones, reembolsos, pagos a anfitriones y publicación de alojamientos. Contacta con nuestro equipo de ayuda." },
    de: { title: "RoomEasy Hilfe — Buchungen, Stornierungen und Erstattungen", description: "Antworten zu Buchungen, Stornierungen, Erstattungen, Auszahlungen an Gastgeber und Inseraten. Kontaktieren Sie unser Support-Team." },
    pt: { title: "Centro de ajuda RoomEasy — reservas, cancelamentos e reembolsos", description: "Respostas sobre reservas, cancelamentos, reembolsos, pagamentos a anfitriões e publicação de alojamentos. Contacte a nossa equipa de apoio." },
  },
  terms: {
    en: { title: "Terms of service — RoomEasy", description: "The booking, accommodation, cancellation and payment terms that apply when using RoomEasy." },
    fr: { title: "Conditions générales d'utilisation — RoomEasy", description: "Les règles de réservation, d'hébergement, d'annulation et de paiement applicables sur RoomEasy." },
    es: { title: "Condiciones de uso — RoomEasy", description: "Las normas de reserva, alojamiento, cancelación y pago aplicables en RoomEasy." },
    de: { title: "Nutzungsbedingungen — RoomEasy", description: "Die Regeln für Buchungen, Unterkünfte, Stornierungen und Zahlungen auf RoomEasy." },
    pt: { title: "Termos de utilização — RoomEasy", description: "As regras de reservas, alojamento, cancelamento e pagamento aplicáveis na RoomEasy." },
  },
  privacy: {
    en: { title: "Privacy policy — RoomEasy", description: "How RoomEasy collects, uses and protects your personal data for bookings, hosting and payments." },
    fr: { title: "Politique de confidentialité — RoomEasy", description: "Comment RoomEasy collecte, utilise et protège vos données personnelles lors des réservations, de la mise en location et des paiements." },
    es: { title: "Política de privacidad — RoomEasy", description: "Cómo RoomEasy recopila, utiliza y protege tus datos personales durante las reservas, el alojamiento y los pagos." },
    de: { title: "Datenschutzerklärung — RoomEasy", description: "Wie RoomEasy Ihre personenbezogenen Daten bei Buchungen, beim Vermieten und bei Zahlungen erhebt, verwendet und schützt." },
    pt: { title: "Política de privacidade — RoomEasy", description: "Como a RoomEasy recolhe, utiliza e protege os seus dados pessoais nas reservas, alojamento e pagamentos." },
  },
  host: {
    en: { title: "List your place — become a RoomEasy host", description: "Publish your apartment, villa, chalet or guesthouse in seven guided steps: details, location, rooms, amenities, photos, pricing and publishing." },
    fr: { title: "Mettre son logement en location — devenir hôte RoomEasy", description: "Publiez votre appartement, villa, chalet ou maison d'hôtes en sept étapes guidées : informations, adresse, espaces, équipements, photos, tarifs et mise en ligne." },
    es: { title: "Publica tu alojamiento — hazte anfitrión de RoomEasy", description: "Publica tu apartamento, villa, chalet o casa de huéspedes en siete pasos: datos, ubicación, habitaciones, servicios, fotos, precios y publicación." },
    de: { title: "Unterkunft inserieren — RoomEasy-Gastgeber werden", description: "Veröffentlichen Sie Ihre Wohnung, Villa, Ihr Chalet oder Gästehaus in sieben Schritten: Angaben, Standort, Räume, Ausstattung, Fotos und Preise." },
    pt: { title: "Publique o seu alojamento — torne-se anfitrião RoomEasy", description: "Publique o seu apartamento, moradia, chalé ou casa de hóspedes em sete passos: dados, localização, quartos, comodidades, fotos e preços." },
  },
};