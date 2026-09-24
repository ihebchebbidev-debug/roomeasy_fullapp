import { useEffect, useState, type ReactNode } from "react";

import { catalogApi, catalogEnabled, type ContentPageDto } from "@/api/http/catalog.http";
import { AppShell } from "@/components/layout/AppShell";
import { RichTextView } from "@/components/legal/RichText";
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

/** Shows the edited page when one exists, otherwise the built-in content. */
export function CmsOrFallback({ slug, children }: { slug: string; children: ReactNode }) {
  const { t } = useLanguage();
  const page = useCmsPage(slug);
  if (!page) return <>{children}</>;
  return (
    <AppShell title={page.title} subtitle={`${t.app.legal.updated}: ${page.updatedAt.slice(0, 10)}`}>
      <RichTextView body={page.body} className="max-w-3xl" />
    </AppShell>
  );
}
