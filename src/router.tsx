import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { splitLocale, withLocale, type UrlLocaleRef } from "./i18n/urlLocale";

export const getRouter = () => {
  const queryClient = new QueryClient();
  // One router per request on the server, one per tab in the browser, so this
  // holder never leaks a language between visitors.
  const urlLocale: UrlLocaleRef = { current: null };

  const router = createRouter({
    routeTree,
    context: { queryClient, urlLocale },
    // `/fr/stays` is matched as `/stays`; links get the prefix back.
    rewrite: {
      input: ({ url }) => {
        const { locale, path } = splitLocale(url.pathname);
        urlLocale.current = locale;
        if (!locale) return undefined;
        url.pathname = path;
        return url;
      },
      output: ({ url }) => {
        if (!urlLocale.current) return undefined;
        if (splitLocale(url.pathname).locale) return undefined;
        url.pathname = withLocale(url.pathname, urlLocale.current);
        return url;
      },
    },
    scrollRestoration: true,
    // Fetch the next page's code and data as soon as the pointer touches a
    // link, so the click itself feels instant.
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
    defaultPreloadStaleTime: 0,
    // Keep already-loaded route data for a minute instead of re-fetching it on
    // every navigation.
    defaultStaleTime: 60_000,
    defaultGcTime: 5 * 60_000,
  });

  return router;
};
