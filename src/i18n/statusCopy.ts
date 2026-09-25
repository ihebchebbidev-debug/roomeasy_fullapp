import { splitLocale, type UrlLocale } from "./urlLocale";

type StatusCopy = {
  nfEyebrow: string; nfTitle: string; nfText: string;
  errEyebrow: string; errTitle: string; errText: string;
  home: string; browse: string; retry: string;
};

const COPY: Record<UrlLocale, StatusCopy> = {
  en: { nfEyebrow: "Error 404", nfTitle: "Page not found", nfText: "The page you're looking for doesn't exist or has been moved.", errEyebrow: "Something went wrong", errTitle: "This page didn't load", errText: "Something went wrong on our end. You can try refreshing or head back home.", home: "Go home", browse: "Browse stays", retry: "Try again" },
  fr: { nfEyebrow: "Erreur 404", nfTitle: "Page introuvable", nfText: "La page que vous cherchez n'existe pas ou a été déplacée.", errEyebrow: "Un problème est survenu", errTitle: "Cette page n'a pas pu se charger", errText: "Un problème est survenu de notre côté. Réessayez ou revenez à l'accueil.", home: "Accueil", browse: "Voir les séjours", retry: "Réessayer" },
  es: { nfEyebrow: "Error 404", nfTitle: "Página no encontrada", nfText: "La página que buscas no existe o se ha movido.", errEyebrow: "Algo salió mal", errTitle: "Esta página no se ha cargado", errText: "Algo salió mal por nuestra parte. Prueba a recargar o vuelve al inicio.", home: "Ir al inicio", browse: "Ver alojamientos", retry: "Reintentar" },
  de: { nfEyebrow: "Fehler 404", nfTitle: "Seite nicht gefunden", nfText: "Die gesuchte Seite existiert nicht oder wurde verschoben.", errEyebrow: "Etwas ist schiefgelaufen", errTitle: "Diese Seite konnte nicht geladen werden", errText: "Bei uns ist etwas schiefgelaufen. Lade die Seite neu oder kehre zur Startseite zurück.", home: "Zur Startseite", browse: "Unterkünfte ansehen", retry: "Erneut versuchen" },
  pt: { nfEyebrow: "Erro 404", nfTitle: "Página não encontrada", nfText: "A página que procura não existe ou foi movida.", errEyebrow: "Algo correu mal", errTitle: "Esta página não carregou", errText: "Algo correu mal do nosso lado. Tente atualizar ou volte ao início.", home: "Ir para o início", browse: "Ver alojamentos", retry: "Tentar novamente" },
};

export function statusCopy(pathname: string): StatusCopy {
  return COPY[splitLocale(pathname).locale ?? "en"];
}
