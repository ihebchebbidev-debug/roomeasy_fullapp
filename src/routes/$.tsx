import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pickCopy } from "@/i18n/copy";
import { useLanguage } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found — RoomEasy" },
      { name: "description", content: "This RoomEasy page does not exist. Head back home or browse available stays." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Page not found — RoomEasy" },
      { property: "og:description", content: "This page does not exist. Browse available stays instead." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotFoundPage,
});

const copyByLocale = {
  en: {
    title: "We couldn't find that page",
    text: "The link may be out of date. Head back home or explore the stays we have available.",
    home: "Home",
    browse: "Browse stays",
  },
  fr: {
    title: "Cette page n'existe pas",
    text: "Le lien est peut-être ancien. Retournez à l'accueil ou explorez les logements disponibles.",
    home: "Accueil",
    browse: "Voir les logements",
  },
  es: {
    title: "No encontramos esa página",
    text: "Puede que el enlace esté desactualizado. Vuelve al inicio o explora los alojamientos disponibles.",
    home: "Inicio",
    browse: "Ver alojamientos",
  },
  de: {
    title: "Diese Seite gibt es nicht",
    text: "Der Link ist vielleicht veraltet. Zurück zur Startseite oder verfügbare Unterkünfte entdecken.",
    home: "Startseite",
    browse: "Unterkünfte ansehen",
  },
  pt: {
    title: "Não encontrámos essa página",
    text: "O link pode estar desatualizado. Volte ao início ou explore as estadias disponíveis.",
    home: "Início",
    browse: "Ver estadias",
  },
} as const;

function NotFoundPage() {
  const { locale } = useLanguage();
  const c = pickCopy(locale, copyByLocale);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="font-mono text-sm tracking-[0.3em] text-muted-foreground uppercase">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          {c.title}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {c.text}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link to="/">
              <Home className="size-4" aria-hidden />
              {c.home}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/stays">
              <Compass className="size-4" aria-hidden />
              {c.browse}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
