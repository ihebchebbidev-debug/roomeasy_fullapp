import { Link, createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect } from "react";

import { ensureStays } from "@/api/backend";
import { AccountShell } from "@/components/layout/AccountShell";
import { PropertyCard } from "@/components/home/PropertyCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useFavorites } from "@/hooks/useFavorites";
import { useLazyList } from "@/hooks/useLazyList";
import { useLanguage } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/favourites")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Saved stays — RoomEasy" },
      { name: "description", content: "Every RoomEasy stay you saved, ready to compare and book." },
      { property: "og:title", content: "Saved stays — RoomEasy" },
      {
        property: "og:description",
        content: "Every RoomEasy stay you saved, ready to compare and book.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavouritesPage,
});

function FavouritesPage() {
  const { t } = useLanguage();
  const { favorites, isFavorite, toggle } = useFavorites();
  const properties = useAllProperties();
  // Saved stays outside the hydrated catalogue are fetched one by one.
  useEffect(() => {
    void ensureStays(favorites);
  }, [favorites]);
  const saved = properties.filter((property) => favorites.includes(property.id));

  const lazy = useLazyList(saved, 6);

  return (
    <AccountShell title={t.app.favourites.title} subtitle={t.app.favourites.subtitle}>
      {saved.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t.app.favourites.empty}
          action={
            <Button asChild>
              <Link to="/stays">{t.nav.stays}</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {lazy.visible.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorite={isFavorite(property.id)}
              onToggleFavorite={(id) => toggle(id)}
            />
          ))}
          <div ref={lazy.sentinelRef} aria-hidden />
        </div>
      )}
    </AccountShell>
  );
}
