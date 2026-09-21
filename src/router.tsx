import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
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
