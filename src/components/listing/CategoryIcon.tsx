import { Home } from "lucide-react";

import apartment from "@/assets/icons/v2-apartment.png";
import bungalow from "@/assets/icons/v2-bungalow.png";
import camping from "@/assets/icons/v2-camping.png";
import chalet from "@/assets/icons/v2-chalet.png";
import guesthouse from "@/assets/icons/v2-guesthouse.png";
import hostel from "@/assets/icons/v2-hostel.png";
import hotel from "@/assets/icons/v2-hotel.png";
import lodge from "@/assets/icons/v2-lodge.png";
import resort from "@/assets/icons/v2-resort.png";
import riad from "@/assets/icons/v2-riad.png";
import studio from "@/assets/icons/v2-studio.png";
import villa from "@/assets/icons/v2-villa.png";
import type { PropertyCategory } from "@/models/property";
import { cn } from "@/lib/utils";

/** One illustrated set, same stroke and colour, for every stay type. */
const images: Record<PropertyCategory, string> = {
  apartment,
  resort,
  lodge,
  hotel,
  villa,
  guesthouse,
  riad,
  studio,
  bungalow,
  chalet,
  hostel,
  camping,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: PropertyCategory;
  className?: string;
}) {
  const image = images[category];
  if (!image) return <Home className={cn("size-8", className)} aria-hidden />;
  return (
    <img
      src={image}
      alt=""
      aria-hidden
      loading="lazy"
      width={512}
      height={512}
      className={cn("size-8 object-contain", className)}
    />
  );
}
