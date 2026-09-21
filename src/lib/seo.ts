/**
 * Central SEO helpers.
 *
 * Every public page builds its head tags from here so titles, descriptions,
 * canonical URLs and share cards stay consistent and always absolute —
 * social crawlers reject relative og:image / og:url values.
 */

/** The public address of the site. */
export const SITE_URL = "https://www.roomeasy.fr";

export const SITE_NAME = "RoomEasy";

export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Keyword sets reused across the public pages (French market first). */
export const KEYWORDS = {
  home: "location vacances France, réservation logement, séjour, appartement, villa, chalet, maison de vacances, location saisonnière, RoomEasy, roomeasy.fr",
  search:
    "location vacances Paris, location Lyon, location Marseille, appartement bord de mer, chalet montagne, villa avec piscine, réservation en ligne",
  host: "louer mon logement, devenir hôte, mettre son appartement en location, revenus locatifs, conciergerie location saisonnière",
  help: "aide RoomEasy, service client location, annulation réservation, remboursement, contact support",
} as const;

type MetaTag = { title?: string; name?: string; property?: string; content?: string };

/** Share-card meta shared by every public page. */
export function shareMeta(title: string, description: string, type = "website", image = OG_IMAGE): MetaTag[] {
  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: title },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "fr_FR" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

/**
 * Full meta block for an indexable page: title, description, keywords,
 * canonical URL and the complete share card.
 */
export function publicPageMeta(options: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  type?: string;
  image?: string;
}): MetaTag[] {
  const url = absoluteUrl(options.path);
  return [
    { title: options.title },
    { name: "description", content: options.description },
    ...(options.keywords ? [{ name: "keywords", content: options.keywords }] : []),
    { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
    { property: "og:url", content: url },
    ...shareMeta(options.title, options.description, options.type, options.image),
  ];
}

/** Canonical link for an indexable page. */
export function canonical(path: string) {
  return [{ rel: "canonical", href: absoluteUrl(path) }];
}

/** Meta for account-only pages that must never appear in search results. */
export function privatePageMeta(title: string, description: string): MetaTag[] {
  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary" },
  ];
}
