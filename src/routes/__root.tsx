import { Compass, TriangleAlert } from "lucide-react";
import { StatusScreen } from "@/components/layout/StatusScreen";
import { catalogApi } from "@/api/http/catalog.http";
import { setPropertyTypes } from "@/models/property";
import { useEffect } from "react";
import { loadEquipmentFromApi } from "@/data/equipment";
import { equipmentApi } from "@/api/http/platform.http";
import { backendEnabled } from "@/api/backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { CurrencyProvider } from "@/i18n/CurrencyProvider";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Toaster } from "@/components/ui/sonner";
import { useBackendHydration } from "@/hooks/useBackendHydration";
import { ComingSoonGate } from "@/components/gate/ComingSoonGate";
import { getGateState } from "@/lib/gate.functions";
import type { UrlLocaleRef } from "@/i18n/urlLocale";
import { statusCopy } from "@/i18n/statusCopy";
import { useRouterState } from "@tanstack/react-router";

function NotFoundComponent() {
  const c = statusCopy(useRouterState({ select: (st) => st.location.pathname }));
  return (
    <StatusScreen
      icon={<Compass className="h-7 w-7" />}
      eyebrow={c.nfEyebrow}
      title={c.nfTitle}
      text={c.nfText}
      actions={
        <>
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {c.home}
          </Link>
          <Link
            to="/stays"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {c.browse}
          </Link>
        </>
      }
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const c = statusCopy(useRouterState({ select: (st) => st.location.pathname }));

  return (
    <StatusScreen
      icon={<TriangleAlert className="h-7 w-7" />}
      eyebrow={c.errEyebrow}
      title={c.errTitle}
      text={c.errText}
      actions={
        <>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {c.retry}
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {c.home}
          </a>
        </>
      }
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; urlLocale: UrlLocaleRef }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RoomEasy — Handpicked stays" },
      { name: "description", content: "Discover and reserve handpicked stays with RoomEasy." },
      { name: "author", content: "RoomEasy" },
      { property: "og:title", content: "RoomEasy — Handpicked stays" },
      { property: "og:description", content: "Discover and reserve handpicked stays with RoomEasy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://api.roomeasy.fr", crossOrigin: "use-credentials" },
      { rel: "preconnect", href: "https://images.roomeasy.fr" },
      { rel: "dns-prefetch", href: "https://images.unsplash.com" },
      { rel: "dns-prefetch", href: "https://picsum.photos" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Space+Mono:wght@400;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),

  // The gate state barely changes; cache it so navigation does not wait for a
  // server round-trip on every single page change.
  loader: () => getGateState(),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const lang = (router.options.context as { urlLocale?: UrlLocaleRef } | undefined)?.urlLocale?.current ?? "en";
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { locked } = Route.useLoaderData();
  useBackendHydration();
  useEffect(() => {
    if (!backendEnabled) return;
    void loadEquipmentFromApi(() => equipmentApi.list());
    catalogApi.publicPropertyTypes().then(setPropertyTypes).catch(() => undefined);
  }, []);

  if (locked) {
    return <ComingSoonGate />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CurrencyProvider>
          <Outlet />
          <CookieBanner />
          <Toaster />
        </CurrencyProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
