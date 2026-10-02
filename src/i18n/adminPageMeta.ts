import type { Locale } from "@/i18n/translations";

export const adminPageMeta: Record<"overview" | "member" | "listing" | "ticket", Record<Locale, { title: string; description: string }>> = {
  overview: {
    en: { title: "Admin back office — RoomEasy", description: "Moderate listings, manage members, review payouts and platform settings." },
    fr: { title: "Administration — RoomEasy", description: "Modérez les annonces, gérez les membres, consultez les versements et configurez la plateforme." },
    es: { title: "Administración — RoomEasy", description: "Modera anuncios, gestiona miembros, revisa pagos y configura la plataforma." },
    de: { title: "Verwaltung — RoomEasy", description: "Prüfen Sie Inserate, verwalten Sie Mitglieder, Auszahlungen und Plattformeinstellungen." },
    pt: { title: "Administração — RoomEasy", description: "Modere anúncios, gira membros, consulte pagamentos e configure a plataforma." },
  },
  member: {
    en: { title: "Member details — RoomEasy back office", description: "Member identity, listings, bookings, trips and reviews." },
    fr: { title: "Détails du membre — administration RoomEasy", description: "Identité, annonces, réservations, séjours et avis du membre." },
    es: { title: "Datos del miembro — administración RoomEasy", description: "Identidad, anuncios, reservas, viajes y opiniones del miembro." },
    de: { title: "Mitgliederdetails — RoomEasy-Verwaltung", description: "Identität, Inserate, Buchungen, Reisen und Bewertungen des Mitglieds." },
    pt: { title: "Dados do membro — administração RoomEasy", description: "Identidade, anúncios, reservas, viagens e avaliações do membro." },
  },
  listing: {
    en: { title: "Listing review — RoomEasy back office", description: "Full listing preview for moderators, with approval controls." },
    fr: { title: "Examen de l'annonce — administration RoomEasy", description: "Aperçu complet de l'annonce et contrôles d'approbation pour les modérateurs." },
    es: { title: "Revisión del anuncio — administración RoomEasy", description: "Vista completa del anuncio y controles de aprobación para moderadores." },
    de: { title: "Inseratsprüfung — RoomEasy-Verwaltung", description: "Vollständige Inseratsvorschau und Freigabeoptionen für Moderatoren." },
    pt: { title: "Revisão do anúncio — administração RoomEasy", description: "Pré-visualização completa do anúncio e controlos de aprovação para moderadores." },
  },
  ticket: {
    en: { title: "Support ticket — RoomEasy back office", description: "Full support ticket thread with moderation and dispute actions." },
    fr: { title: "Demande d'assistance — administration RoomEasy", description: "Conversation complète et actions de modération et de résolution des litiges." },
    es: { title: "Solicitud de asistencia — administración RoomEasy", description: "Conversación completa y acciones de moderación y resolución de disputas." },
    de: { title: "Supportanfrage — RoomEasy-Verwaltung", description: "Vollständiger Verlauf mit Moderations- und Streitfallaktionen." },
    pt: { title: "Pedido de assistência — administração RoomEasy", description: "Conversa completa e ações de moderação e resolução de litígios." },
  },
};