import { Bed, Building2, Castle, Home, Hotel, Palmtree, Tent, TreePine, Warehouse, type LucideIcon } from "lucide-react";

import apartmentIcon from "@/assets/icons/cat-apartment.png";
import hotelIcon from "@/assets/icons/cat-hotel.png";
import lodgeIcon from "@/assets/icons/cat-lodge.png";
import resortIcon from "@/assets/icons/cat-resort.png";
import type { PropertyCategory } from "@/models/property";
import { cn } from "@/lib/utils";

const images: Partial<Record<PropertyCategory, string>> = {
  apartment: apartmentIcon,
  resort: resortIcon,
  lodge: lodgeIcon,
  hotel: hotelIcon,
};

const fallbackIcons: Record<PropertyCategory, LucideIcon> = {
  apartment: Building2,
  resort: Palmtree,
  lodge: TreePine,
  hotel: Hotel,
  villa: Home,
  guesthouse: Home,
  riad: Castle,
  studio: Warehouse,
  bungalow: Home,
  chalet: TreePine,
  hostel: Bed,
  camping: Tent,
};

/** Hand-drawn line icon for a property type, with a line-icon fallback. */
export function CategoryIcon({
  category,
  className,
}: {
  category: PropertyCategory;
  className?: string;
}) {
  const image = images[category];
  if (!image) {
    const Icon = fallbackIcons[category] ?? Home;
    return <Icon className={cn("size-7", className)} aria-hidden />;
  }
  return (
    <img
      src={image}
      alt=""
      aria-hidden
      loading="lazy"
      width={816}
      height={816}
      className={cn("size-7 object-contain", className)}
    />
  );
}
