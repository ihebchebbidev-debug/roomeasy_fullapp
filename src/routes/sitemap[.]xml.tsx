import { createFileRoute } from "@tanstack/react-router";

import { API_BASE_URL } from "@/api/http/client";
import { SITE_URL } from "@/lib/seo";
import { URL_LOCALES, withLocale } from "@/i18n/urlLocale";

/** Pages that are always public and indexable. */
const STATIC_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/stays", priority: "0.9", changefreq: "daily" },
  { path: "/list-your-place", priority: "0.8", changefreq: "weekly" },
  { path: "/help", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
];

type StaySummary = { id?: string; propertyId?: string; updatedAt?: string };

/** Best-effort list of published stays; the sitemap still renders if the API is down. */
async function fetchStayPaths(): Promise<{ path: string; lastmod?: string }[]> {
  try {
    // The public catalogue lives at /api/stays and answers { data: [...] }.
    const response = await fetch(`${API_BASE_URL}/api/stays?limit=100`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      data?: { items?: StaySummary[] } | StaySummary[];
      items?: StaySummary[];
    };
    const raw = Array.isArray(payload.data)
      ? payload.data
      : (payload.data?.items ?? payload.items ?? []);
    const paths: { path: string; lastmod?: string }[] = [];
    for (const item of raw) {
      const id = item.id ?? item.propertyId;
      if (typeof id !== "string" || !id) continue;
      const updated = typeof item.updatedAt === "string" ? item.updatedAt.slice(0, 10) : "";
      paths.push({ path: `/stays/${encodeURIComponent(id)}`, ...(updated ? { lastmod: updated } : {}) });
    }
    return paths;
  } catch {
    return [];
  }
}

/** One <url> per language version, each listing every sibling (hreflang). */
function urlEntries(path: string, priority: string, changefreq: string, lastmod: string): string[] {
  const alternates = [
    ...URL_LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${withLocale(path, l)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}"/>`,
  ].join("\n");
  return [null, ...URL_LOCALES].map(
    (l) =>
      `  <url>\n    <loc>${SITE_URL}${withLocale(path, l)}</loc>\n${alternates}\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  );
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const lastmod = new Date().toISOString().slice(0, 10);
        const stays = await fetchStayPaths();
        const entries = [
          ...STATIC_ROUTES.flatMap((route) => urlEntries(route.path, route.priority, route.changefreq, lastmod)),
          ...stays.flatMap((stay) => urlEntries(stay.path, "0.7", "weekly", stay.lastmod ?? lastmod)),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
