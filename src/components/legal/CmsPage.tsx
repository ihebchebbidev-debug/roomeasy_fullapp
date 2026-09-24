import { useEffect, useState, type ReactNode } from "react";

import { catalogApi, catalogEnabled, type ContentPageDto } from "@/api/http/catalog.http";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/i18n/LanguageProvider";

/** Loads the admin-edited version of a page; null while missing so the built-in text shows. */
export function useCmsPage(slug: string) {
  const { locale } = useLanguage();
  const [page, setPage] = useState<ContentPageDto | null>(null);
  useEffect(() => {
    if (!catalogEnabled) return;
    let alive = true;
    catalogApi
      .publicPage(slug, locale)
      .then((p) => alive && setPage(p))
      .catch(() => alive && setPage(null));
    return () => {
      alive = false;
    };
  }, [slug, locale]);
  return page;
}

function renderBody(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) =>
      block.startsWith("## ") ? (
        <h2 key={i} className="font-display text-lg font-bold">
          {block.slice(3)}
        </h2>
      ) : (
        <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {block}
        </p>
      ),
    );
}

/** Shows the edited page when one exists, otherwise the built-in content. */
export function CmsOrFallback({ slug, children }: { slug: string; children: ReactNode }) {
  const { t } = useLanguage();
  const page = useCmsPage(slug);
  if (!page) return <>{children}</>;
  return (
    <AppShell title={page.title} subtitle={`${t.app.legal.updated}: ${page.updatedAt.slice(0, 10)}`}>
      <div className="max-w-3xl space-y-4">{renderBody(page.body)}</div>
    </AppShell>
  );
}
