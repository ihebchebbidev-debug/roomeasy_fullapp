import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { PropertyCard } from "@/components/home/PropertyCard";
import { Reveal } from "@/components/layout/Reveal";
import { useAllProperties } from "@/hooks/useAllProperties";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Locale } from "@/i18n/translations";
import type { Property, PropertyCategory } from "@/models/property";
import { PRICE_CEILING, type SortOption } from "@/models/staySearch";

type CollectionCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

const copy: Record<Locale, {
  fresh: CollectionCopy;
  favourites: CollectionCopy;
  coast: CollectionCopy;
  city: CollectionCopy;
  cabins: CollectionCopy;
}> = {
  en: {
    fresh: { eyebrow: "Just added", title: "New on RoomEasy", description: "The latest stays approved on the platform." },
    favourites: { eyebrow: "Loved by guests", title: "Guest favourites", description: "Top-rated homes with exceptional reviews and trusted hosts." },
    coast: { eyebrow: "Sun and water", title: "Coastal escapes", description: "Beachfront resorts, private pools and views worth waking up for." },
    city: { eyebrow: "In the heart of it", title: "City stays", description: "Well-placed apartments and hotels for effortless urban weekends." },
    cabins: { eyebrow: "Room to breathe", title: "Cabins and nature", description: "Quiet lodges near mountains, forests and wide-open landscapes." },
  },
  fr: {
    fresh: { eyebrow: "Tout nouveau", title: "Nouveautés RoomEasy", description: "Les derniers logements validés sur la plateforme." },
    favourites: { eyebrow: "Adorés des voyageurs", title: "Coups de cœur voyageurs", description: "Des logements très bien notés, avec des avis remarquables et des hôtes de confiance." },
    coast: { eyebrow: "Soleil et horizon", title: "Escapades en bord de mer", description: "Resorts en front de mer, piscines privées et vues inoubliables." },
    city: { eyebrow: "Au cœur de la ville", title: "Séjours urbains", description: "Appartements et hôtels bien situés pour vos week-ends en ville." },
    cabins: { eyebrow: "Respirer autrement", title: "Cabanes et nature", description: "Des lodges paisibles près des montagnes, forêts et grands espaces." },
  },
  es: {
    fresh: { eyebrow: "Recién llegados", title: "Novedades en RoomEasy", description: "Los últimos alojamientos aprobados en la plataforma." },
    favourites: { eyebrow: "Favoritos de huéspedes", title: "Los más queridos", description: "Alojamientos mejor valorados con excelentes reseñas y anfitriones de confianza." },
    coast: { eyebrow: "Sol y mar", title: "Escapadas costeras", description: "Resorts frente al mar, piscinas privadas y vistas inolvidables." },
    city: { eyebrow: "En el centro", title: "Estancias urbanas", description: "Apartamentos y hoteles bien situados para una escapada a la ciudad." },
    cabins: { eyebrow: "Espacio para respirar", title: "Cabañas y naturaleza", description: "Alojamientos tranquilos cerca de montañas, bosques y paisajes abiertos." },
  },
  de: {
    fresh: { eyebrow: "Neu dabei", title: "Neu bei RoomEasy", description: "Die zuletzt freigegebenen Unterkünfte auf der Plattform." },
    favourites: { eyebrow: "Von Gästen geliebt", title: "Gäste-Favoriten", description: "Bestbewertete Unterkünfte mit hervorragenden Bewertungen und verlässlichen Gastgebern." },
    coast: { eyebrow: "Sonne und Wasser", title: "Auszeit an der Küste", description: "Strandresorts, private Pools und Aussichten, für die sich das Aufstehen lohnt." },
    city: { eyebrow: "Mitten im Leben", title: "Städtetrips", description: "Zentral gelegene Apartments und Hotels für entspannte Wochenenden." },
    cabins: { eyebrow: "Raum zum Atmen", title: "Hütten und Natur", description: "Ruhige Lodges nahe Bergen, Wäldern und weiten Landschaften." },
  },
  pt: {
    fresh: { eyebrow: "Acabados de chegar", title: "Novidades na RoomEasy", description: "Os alojamentos aprovados mais recentemente na plataforma." },
    favourites: { eyebrow: "Adorados pelos hóspedes", title: "Favoritos dos hóspedes", description: "Casas mais bem avaliadas, com excelentes opiniões e anfitriões de confiança." },
    coast: { eyebrow: "Sol e mar", title: "Escapadas costeiras", description: "Resorts à beira-mar, piscinas privadas e vistas inesquecíveis." },
    city: { eyebrow: "No centro de tudo", title: "Estadias urbanas", description: "Apartamentos e hotéis bem localizados para fins de semana na cidade." },
    cabins: { eyebrow: "Espaço para respirar", title: "Cabanas e natureza", description: "Lodges tranquilos perto de montanhas, florestas e grandes paisagens." },
  },
};

type CollectionProps = {
  id: string;
  content: CollectionCopy;
  properties: Property[];
  category: "all" | PropertyCategory;
  sort?: SortOption;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  seeAll: string;
};

function Collection({ id, content, properties, category, sort = "recommended", isFavorite, onToggleFavorite, seeAll }: CollectionProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-t border-border/70 py-10 sm:py-14">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 shrink-0 bg-primary" aria-hidden />
            <p className="text-[11px] font-bold tracking-[0.3em] text-primary uppercase">{content.eyebrow}</p>
          </div>
          <h3 id={`${id}-title`} className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{content.title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{content.description}</p>
        </div>

        <Link
          to="/stays"
          search={{ where: "", from: "", to: "", guests: 1, category, maxPrice: PRICE_CEILING, rating: 0, beds: 0, sort }}
          aria-label={`${seeAll}: ${content.title}`}
          className="group mb-1 inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-foreground focus-visible:outline-none"
        >
          <span className="hidden sm:inline">{seeAll}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>

      <div className="no-scrollbar -mx-7 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-7 pb-3 scroll-pl-7 scroll-pr-7 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 sm:scroll-pl-0 sm:scroll-pr-0 lg:grid-cols-4">
        {properties.slice(0, 8).map((property, index) => (
          <Reveal key={property.id} delay={(index % 4) * 60} className="w-[78vw] max-w-[19rem] shrink-0 snap-start sm:w-auto sm:max-w-none [&>*]:h-full">
            <PropertyCard property={property} isFavorite={isFavorite(property.id)} onToggleFavorite={onToggleFavorite} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function StaysSection() {
  const { t, locale } = useLanguage();
  const properties = useAllProperties();
  const { isFavorite, toggle } = useFavorites();
  const pageCopy = copy[locale];

  // Newest first everywhere, so a stay approved today shows up straight away.
  const time = (p: Property) => (p.createdAt ? Date.parse(p.createdAt) : 0);
  const newest = [...properties].sort((a, b) => time(b) - time(a));
  const inCategories = (list: PropertyCategory[]) => newest.filter((p) => list.includes(p.category));

  const guestFavourites = [...properties]
    .filter((property) => property.rating >= 4.8)
    .sort((a, b) => b.rating - a.rating || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
  const coastal = newest.filter(
    (property) =>
      ["resort", "villa", "riad", "bungalow"].includes(property.category) ||
      property.tags?.some((tag) => /beach|sea|pool|harbour|river|caldera/i.test(tag)),
  );
  const city = inCategories(["apartment", "hotel", "studio", "hostel", "guesthouse"]);
  const cabins = inCategories(["lodge", "chalet", "camping"]);

  function handleFavourite(id: string) {
    const added = toggle(id);
    toast(added ? t.listings.favouriteAdded : t.listings.favouriteRemoved);
  }

  const shared = { isFavorite, onToggleFavorite: handleFavourite, seeAll: t.listings.seeAll };

  return (
    <section id="stays" className="mx-auto max-w-7xl px-7 pt-16 pb-6 sm:px-8 sm:pt-24">
      <Collection id="just-added" content={pageCopy.fresh} properties={newest} category="all" {...shared} />
      {guestFavourites.length ? <Collection id="guest-favourites" content={pageCopy.favourites} properties={guestFavourites} category="all" sort="rating" {...shared} /> : null}
      <Collection id="coastal-escapes" content={pageCopy.coast} properties={coastal} category="resort" {...shared} />
      <Collection id="city-stays" content={pageCopy.city} properties={city} category="apartment" {...shared} />
      <Collection id="cabins-nature" content={pageCopy.cabins} properties={cabins} category="lodge" {...shared} />
    </section>
  );
}