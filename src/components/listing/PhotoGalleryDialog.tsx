import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

type PhotoGalleryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  propertyName: string;
  location: string;
};

export function PhotoGalleryDialog({
  open,
  onOpenChange,
  images,
  activeIndex,
  onActiveIndexChange,
  propertyName,
  location,
}: PhotoGalleryDialogProps) {
  const { locale } = useLanguage();
  const copy = pickCopy(locale, {
    en: { gallery: "Photo gallery", previous: "Previous photo", next: "Next photo", thumbnail: "View photo" },
    fr: { gallery: "Galerie photos", previous: "Photo précédente", next: "Photo suivante", thumbnail: "Afficher la photo" },
    es: { gallery: "Galería de fotos", previous: "Foto anterior", next: "Foto siguiente", thumbnail: "Ver la foto" },
    de: { gallery: "Fotogalerie", previous: "Vorheriges Foto", next: "Nächstes Foto", thumbnail: "Foto ansehen" },
    pt: { gallery: "Galeria de fotos", previous: "Foto anterior", next: "Foto seguinte", thumbnail: "Ver a foto" },
  });

  function move(direction: number) {
    onActiveIndexChange((activeIndex + direction + images.length) % images.length);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, open]);

  const activeImage = images[activeIndex];
  if (!activeImage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-navy p-0 text-navy-foreground sm:h-[94dvh] sm:max-h-[94dvh] sm:w-[calc(100vw-3rem)] sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-navy-foreground/10 px-5 py-4 pr-16 sm:px-7">
          <div className="min-w-0">
            <DialogTitle className="truncate font-display text-base font-semibold text-navy-foreground sm:text-lg">{propertyName}</DialogTitle>
            <DialogDescription className="mt-1 flex items-center gap-2 text-xs text-navy-muted">
              <Images className="size-3.5" aria-hidden />
              {location} · {activeIndex + 1} / {images.length}
            </DialogDescription>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-navy">
          <img
            key={activeImage}
            src={activeImage}
            alt={`${propertyName}, ${location} — ${copy.gallery} ${activeIndex + 1}`}
            className="size-full object-contain px-2 py-4 sm:px-16 sm:py-6"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={() => move(-1)}
            aria-label={copy.previous}
            className="absolute top-1/2 left-3 size-11 -translate-y-1/2 rounded-full bg-surface/90 shadow-lift hover:bg-surface sm:left-6"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={() => move(1)}
            aria-label={copy.next}
            className="absolute top-1/2 right-3 size-11 -translate-y-1/2 rounded-full bg-surface/90 shadow-lift hover:bg-surface sm:right-6"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-t border-navy-foreground/10 px-4 py-3 sm:gap-3 sm:px-7 sm:py-4">
          {images.map((image, index) => (
            <Button
              key={`${image}-${index}`}
              type="button"
              variant="ghost"
              onClick={() => onActiveIndexChange(index)}
              aria-label={`${copy.thumbnail} ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 p-0 opacity-60 transition-opacity hover:bg-transparent hover:opacity-100 sm:h-20 sm:w-28",
                activeIndex === index ? "border-primary opacity-100" : "border-transparent",
              )}
            >
              <img src={image} alt="" className="size-full object-cover" />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}