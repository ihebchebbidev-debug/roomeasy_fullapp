import { useEffect, useState } from "react";

import heroAlps from "@/assets/hero/hero-alps.jpg";
import heroCity from "@/assets/hero/hero-city.jpg";
import heroCoast from "@/assets/hero/hero-coast.jpg";
import heroCountry from "@/assets/hero/hero-country.jpg";
import heroIsland from "@/assets/hero/hero-island.jpg";
import heroLake from "@/assets/hero/hero-lake.jpg";
import heroLodge from "@/assets/hero/hero-lodge.jpg";
import heroLoft from "@/assets/hero/hero-loft.jpg";
import heroResort from "@/assets/hero/hero-resort.jpg";
import heroRiad from "@/assets/hero/hero-riad.jpg";
import mobileAlps from "@/assets/hero/mobile-alps.jpg";
import mobileCity from "@/assets/hero/mobile-city.jpg";
import mobileCoast from "@/assets/hero/mobile-coast.jpg";
import mobileCountry from "@/assets/hero/mobile-country.jpg";
import mobileIsland from "@/assets/hero/mobile-island.jpg";
import mobileLake from "@/assets/hero/mobile-lake.jpg";
import mobileLodge from "@/assets/hero/mobile-lodge.jpg";
import mobileLoft from "@/assets/hero/mobile-loft.jpg";
import mobileResort from "@/assets/hero/mobile-resort.jpg";
import mobileRiad from "@/assets/hero/mobile-riad.jpg";

const slides = [
  { desktop: heroCoast, mobile: mobileCoast },
  { desktop: heroIsland, mobile: mobileIsland },
  { desktop: heroCity, mobile: mobileCity },
  { desktop: heroRiad, mobile: mobileRiad },
  { desktop: heroResort, mobile: mobileResort },
  { desktop: heroAlps, mobile: mobileAlps },
  { desktop: heroLodge, mobile: mobileLodge },
  { desktop: heroLake, mobile: mobileLake },
  { desktop: heroCountry, mobile: mobileCountry },
  { desktop: heroLoft, mobile: mobileLoft },
];
const INTERVAL_MS = 4000;

/**
 * Subtle auto-rotating photo backdrop.
 * Images stay low-contrast behind a scrim so foreground copy remains readable,
 * and rotation pauses for users who prefer reduced motion.
 */
export function HeroBackdrop() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {slides.map((slide, position) => (
        <picture
          key={slide.desktop}
          className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
            position === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <source media="(max-width: 639px)" srcSet={slide.mobile} />
          <img
            src={slide.desktop}
            alt=""
            width={1920}
            height={1080}
            loading={position === 0 ? "eager" : "lazy"}
            className="size-full scale-105 object-cover object-[50%_72%]"
          />
        </picture>
      ))}
    </div>
  );
}
