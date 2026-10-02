/**
 * Listing story = the guest-facing wording of a listing: a short summary, a
 * full description and a set of amenity highlights.
 *
 * Two producers share this file:
 *  - `composeListingStory` builds the wording from the host's own settings
 *    with no model involved (used as the offline/fallback path);
 *  - `generateListingStory` (see `listingStory.functions.ts`) asks the model
 *    for a polished version of the same facts.
 * Both return the exact same shape, so the wizard never cares which ran.
 */

export type StoryFacts = {
  title: string;
  category: string;
  city: string;
  country: string;
  neighbourhood: string;
  guests: number;
  rooms: number;
  beds: number;
  baths: number;
  area: number;
  amenities: string[];
  equipment: string[];
  nightly: string;
  minNights: number;
  checkIn: string;
  checkOut: string;
  instantBook: boolean;
  cancellation: string;
  houseRules: string;
  photoCount: number;
  locale: string;
  notes: string;
};

export type ListingStory = {
  summary: string;
  description: string;
  highlights: string[];
};

const pl = (n: number | string, one: string, many: string) => `${n} ${Number(n) === 1 ? one : many}`;

const join = (items: string[], and: string) => {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0] as string;
  return `${clean.slice(0, -1).join(", ")} ${and} ${clean[clean.length - 1]}`;
};

/** Wording built straight from the host's settings — no model, no invention. */
export function composeListingStory(input: StoryFacts): ListingStory {
  const facts = { ...input, locale: String(input.locale).slice(0, 2).toLowerCase() };
  const fr = facts.locale === "fr";
  const place = [facts.neighbourhood, facts.city, facts.country].filter(Boolean).join(", ");
  const perks = [...new Set([...facts.amenities, ...facts.equipment])].slice(0, 6);
  const and = fr ? "et" : "and";

  const summary = fr
    ? `${facts.title} accueille ${pl(facts.guests,"voyageur","voyageurs")} à ${facts.city || "destination"} : ${pl(facts.rooms,"chambre","chambres")}, ${pl(facts.beds,"lit","lits")}, ${pl(facts.baths,"salle de bain","salles de bain")} et ${facts.area} m².`
    : `${facts.title} hosts up to ${pl(facts.guests,"guest","guests")} in ${facts.city || "town"} with ${pl(facts.rooms,"bedroom","bedrooms")}, ${pl(facts.beds,"bed","beds")}, ${pl(facts.baths,"bathroom","bathrooms")} and ${facts.area} m² of space.`;

  const lines = fr
    ? [
        `${facts.title} est un logement de type ${facts.category.toLowerCase()} situé${place ? ` à ${place}` : ""}. L'espace fait ${facts.area} m² et peut recevoir jusqu'à ${pl(facts.guests,"voyageur","voyageurs")}.`,
        `Vous y trouverez ${pl(facts.rooms,"chambre","chambres")}, ${pl(facts.beds,"lit","lits")} et ${pl(facts.baths,"salle de bain","salles de bain")}.`,
        perks.length ? `Équipements sur place : ${join(perks, and)}.` : "",
        `Arrivée à partir de ${facts.checkIn}, départ avant ${facts.checkOut}. Séjour minimum : ${pl(facts.minNights,"nuit","nuits")}. Tarif : ${facts.nightly} la nuit.`,
        `${facts.instantBook ? "Réservation instantanée activée. " : ""}Annulation : ${facts.cancellation}.`,
        facts.houseRules ? `Règles de la maison : ${facts.houseRules}` : "",
        facts.notes,
      ]
    : [
        `${facts.title} is ${withArticle(facts.category.toLowerCase())}${place ? ` in ${place}` : ""}. The space covers ${facts.area} m² and sleeps up to ${pl(facts.guests,"guest","guests")}.`,
        `Inside you'll find ${pl(facts.rooms,"bedroom","bedrooms")}, ${pl(facts.beds,"bed","beds")} and ${pl(facts.baths,"bathroom","bathrooms")}.`,
        perks.length ? `On site: ${join(perks, and)}.` : "",
        `Check-in from ${facts.checkIn}, check-out by ${facts.checkOut}. Minimum stay ${pl(facts.minNights,"night","nights")}. ${facts.nightly} per night.`,
        `${facts.instantBook ? "Instant booking is on. " : ""}Cancellation: ${facts.cancellation}.`,
        facts.houseRules ? `House rules: ${facts.houseRules}` : "",
        facts.notes,
      ];

  return {
    summary: summary.slice(0, 300),
    description: lines.filter(Boolean).join("\n\n").slice(0, 4000),
    highlights: buildHighlights(facts),
  };
}

function buildHighlights(facts: StoryFacts): string[] {
  const fr = facts.locale === "fr";
  const out: string[] = [];
  if (facts.area) out.push(fr ? `${facts.area} m² pour ${pl(facts.guests,"voyageur","voyageurs")}` : `${facts.area} m² for ${pl(facts.guests,"guest","guests")}`);
  if (facts.rooms) out.push(fr ? `${pl(facts.rooms,"chambre","chambres")}, ${pl(facts.beds,"lit","lits")}` : `${pl(facts.rooms,"bedroom","bedrooms")}, ${pl(facts.beds,"bed","beds")}`);
  for (const perk of new Set([...facts.amenities, ...facts.equipment])) {
    if (out.length >= 6) break;
    out.push(perk);
  }
  if (facts.instantBook && out.length < 6) out.push(fr ? "Réservation instantanée" : "Instant booking");
  return out.slice(0, 6);
}

/** Turns the highlight chips into the bullet block appended to a description. */
export function highlightsBlock(highlights: string[], locale: string) {
  const clean = highlights.map((item) => item.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  const heading = locale === "fr" ? "Les points forts" : "Highlights";
  return `${heading}\n${clean.map((item) => `• ${item}`).join("\n")}`;
}

/** "riad" -> "a riad", "apartment" -> "an apartment". */
function withArticle(word: string): string {
  if (!word) return word;
  return `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;
}
