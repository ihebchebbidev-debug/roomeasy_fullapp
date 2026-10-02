import { useLanguage } from "@/i18n/LanguageProvider";
import type { Locale } from "@/i18n/translations";

const copy = {
  en: { close: "Close", previousSlide: "Previous slide", nextSlide: "Next slide", breadcrumb: "Breadcrumb", more: "More", pagination: "Pagination", previousPage: "Go to previous page", nextPage: "Go to next page", previous: "Previous", next: "Next", morePages: "More pages", sidebar: "Sidebar", sidebarDescription: "Displays the mobile sidebar.", toggleSidebar: "Toggle sidebar" },
  fr: { close: "Fermer", previousSlide: "Diapositive précédente", nextSlide: "Diapositive suivante", breadcrumb: "Fil d'Ariane", more: "Plus", pagination: "Pagination", previousPage: "Aller à la page précédente", nextPage: "Aller à la page suivante", previous: "Précédent", next: "Suivant", morePages: "Autres pages", sidebar: "Barre latérale", sidebarDescription: "Affiche la barre latérale mobile.", toggleSidebar: "Afficher ou masquer la barre latérale" },
  es: { close: "Cerrar", previousSlide: "Diapositiva anterior", nextSlide: "Diapositiva siguiente", breadcrumb: "Ruta de navegación", more: "Más", pagination: "Paginación", previousPage: "Ir a la página anterior", nextPage: "Ir a la página siguiente", previous: "Anterior", next: "Siguiente", morePages: "Más páginas", sidebar: "Barra lateral", sidebarDescription: "Muestra la barra lateral móvil.", toggleSidebar: "Mostrar u ocultar la barra lateral" },
  de: { close: "Schließen", previousSlide: "Vorherige Folie", nextSlide: "Nächste Folie", breadcrumb: "Brotkrumennavigation", more: "Mehr", pagination: "Seitennavigation", previousPage: "Zur vorherigen Seite", nextPage: "Zur nächsten Seite", previous: "Zurück", next: "Weiter", morePages: "Weitere Seiten", sidebar: "Seitenleiste", sidebarDescription: "Zeigt die mobile Seitenleiste an.", toggleSidebar: "Seitenleiste ein- oder ausblenden" },
  pt: { close: "Fechar", previousSlide: "Diapositivo anterior", nextSlide: "Diapositivo seguinte", breadcrumb: "Navegação estrutural", more: "Mais", pagination: "Paginação", previousPage: "Ir para a página anterior", nextPage: "Ir para a página seguinte", previous: "Anterior", next: "Seguinte", morePages: "Mais páginas", sidebar: "Barra lateral", sidebarDescription: "Mostra a barra lateral móvel.", toggleSidebar: "Mostrar ou ocultar a barra lateral" },
} satisfies Record<Locale, Record<string, string>>;

export function useUiCopy() {
  const { locale } = useLanguage();
  return copy[locale];
}