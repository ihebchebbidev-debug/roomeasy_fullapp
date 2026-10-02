/**
 * "1 chambre", "2 chambres": the copy files store plural unit names, so a
 * count of exactly one swaps in the singular. Inline labels are lowercased
 * (German nouns keep their capital).
 */
const SINGULAR: Record<string, string> = {
  // English
  guests: "guest", beds: "bed", bedrooms: "bedroom", rooms: "room", baths: "bath", bathrooms: "bathroom",
  // French
  voyageurs: "voyageur", chambres: "chambre", lits: "lit", "salles de bain": "salle de bain", sdb: "sdb",
  // Spanish
  "huéspedes": "huésped", dormitorios: "dormitorio", habitaciones: "habitación", camas: "cama", "baños": "baño",
  // Portuguese
  "hóspedes": "hóspede", quartos: "quarto", "casas de banho": "casa de banho",
  // German
  "gäste": "gast", betten: "bett", "bäder": "bad", schlafzimmer: "schlafzimmer", zimmer: "zimmer", badezimmer: "badezimmer",
};

const GERMAN = new Set(["gast", "gäste", "bett", "betten", "bad", "bäder", "schlafzimmer", "zimmer", "badezimmer"]);

export function countLabel(n: number, pluralLabel: string): string {
  const lower = pluralLabel.toLowerCase();
  const word = Math.abs(n) === 1 ? (SINGULAR[lower] ?? lower) : lower;
  const shown = GERMAN.has(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word === "sdb" ? "SdB" : word;
  return `${n} ${shown}`;
}
