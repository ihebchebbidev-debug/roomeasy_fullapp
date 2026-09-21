import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * Copy for the features requested in the first client review: rooms,
 * postal-code search, distance sorting, equipment, review moderation and
 * cancellation policies. English and French are complete; other locales
 * fall back to English.
 */
const en = {
  rooms: "Rooms",
  roomsHint: "Bedrooms you need",
  travellers: "Travellers",
  wherePlaceholder: "City, area or postal code",
  sortDistance: "Distance to destination",
  distanceNeedsDestination: "Enter a destination to sort by distance",
  equipment: "Equipment & services",
  equipmentSearch: "Search an equipment or service",
  equipmentEmpty: "No equipment matches that search",
  equipmentHint: "List and update your equipment here — it helps guests choose you.",
  equipmentSelected: "{n} selected",
  paid: "Extra charge",
  free: "Included",
  yes: "Yes",
  no: "No",
  showAll: "Show all",
  showLess: "Show less",
  reviewModeration: "Review moderation",
  hideReview: "Hide",
  unhideReview: "Show again",
  deleteReview: "Delete",
  reviewHidden: "Review hidden",
  reviewRestored: "Review visible again",
  reviewDeleted: "Review deleted",
  hiddenBadge: "Hidden by moderation",
  cancellationPolicy: "Cancellation policy",
  policyFlexible: "Flexible",
  policyModerate: "Moderate",
  policyStrict: "Strict",
  policyFlexibleText: "Free cancellation up to 24 hours before check-in, then the first night is charged.",
  policyModerateText: "Free cancellation up to 5 days before check-in, then 50% is refunded.",
  policyStrictText: "Free cancellation within 48 hours of booking, then no refund.",
  policySaved: "Cancellation policy saved",
  cancelBooking: "Cancel booking",
  bookingCancelled: "Booking cancelled",
  refundDue: "Refund due",
};

const fr: typeof en = {
  rooms: "Chambres",
  roomsHint: "Chambres souhaitées",
  travellers: "Voyageurs",
  wherePlaceholder: "Ville, quartier ou code postal",
  sortDistance: "Distance de la destination",
  distanceNeedsDestination: "Indiquez une destination pour trier par distance",
  equipment: "Équipements et services",
  equipmentSearch: "Rechercher un équipement ou un service",
  equipmentEmpty: "Aucun équipement ne correspond",
  equipmentHint:
    "Répertoriez et mettez à jour vos équipements ici — cela incite les clients à réserver chez vous.",
  equipmentSelected: "{n} sélectionnés",
  paid: "Payant",
  free: "Inclus",
  yes: "Oui",
  no: "Non",
  showAll: "Tout afficher",
  showLess: "Afficher moins",
  reviewModeration: "Modération des avis",
  hideReview: "Masquer",
  unhideReview: "Réafficher",
  deleteReview: "Supprimer",
  reviewHidden: "Avis masqué",
  reviewRestored: "Avis à nouveau visible",
  reviewDeleted: "Avis supprimé",
  hiddenBadge: "Masqué par la modération",
  cancellationPolicy: "Conditions d'annulation",
  policyFlexible: "Flexible",
  policyModerate: "Modérée",
  policyStrict: "Stricte",
  policyFlexibleText:
    "Annulation gratuite jusqu'à 24 heures avant l'arrivée, puis la première nuit est facturée.",
  policyModerateText:
    "Annulation gratuite jusqu'à 5 jours avant l'arrivée, puis 50 % sont remboursés.",
  policyStrictText: "Annulation gratuite dans les 48 heures suivant la réservation, puis aucun remboursement.",
  policySaved: "Conditions d'annulation enregistrées",
  cancelBooking: "Annuler la réservation",
  bookingCancelled: "Réservation annulée",
  refundDue: "Remboursement dû",
};

export const clientCopy = { en, fr };

export function useClientCopy(): typeof en {
  const { locale } = useLanguage();
  return pickCopy(locale, clientCopy) as typeof en;
}
