import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Facebook, Instagram, Linkedin, Music2, Twitter, Youtube } from "lucide-react";

import { settingsApi, type SocialKey } from "@/api/http/platform.http";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/i18n/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t.footer.explore,
      items: [
        { label: t.footer.destinations, to: "/stays" as const },
        { label: t.footer.resorts, to: "/stays" as const },
        { label: t.footer.hotels, to: "/stays" as const },
      ],
    },
    {
      title: t.footer.company,
      items: [
        { label: t.footer.about, to: "/host" as const },
        { label: t.footer.careers, to: "/list-your-place" as const },
        { label: t.footer.press, to: "/help" as const },
      ],
    },
    {
      title: t.footer.support,
      items: [
        { label: t.footer.help, to: "/help" as const },
        { label: t.footer.cancellation, to: "/trips" as const },
        { label: t.footer.contact, to: "/messages" as const },
      ],
    },
  ];

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => settingsApi.get(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const socialMeta: { key: SocialKey; icon: typeof Instagram; label: string }[] = [
    { key: "instagram", icon: Instagram, label: "Instagram" },
    { key: "x", icon: Twitter, label: "X" },
    { key: "facebook", icon: Facebook, label: "Facebook" },
    { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
    { key: "tiktok", icon: Music2, label: "TikTok" },
    { key: "youtube", icon: Youtube, label: "YouTube" },
  ];
  const socials = socialMeta
    .map((s) => ({ ...s, href: settings?.socialLinks?.[s.key]?.trim() ?? "" }))
    .filter((s) => /^https?:\/\//i.test(s.href));

  return (
    <footer className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy p-8 text-navy-foreground sm:p-14">
        <svg
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-80 text-lime opacity-15"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="65" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="35" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="relative grid gap-12 lg:grid-cols-[1.3fr_repeat(3,0.7fr)]">
          <div className="min-w-0">
            <BrandLogo inverted className="h-20" />
            <p className="mt-4 max-w-xs text-sm text-navy-muted">{t.footer.tagline}</p>

            {socials.length > 0 && (
            <>
            <p className="mt-8 text-xs font-semibold tracking-[0.2em] text-navy-muted uppercase">
              {t.footer.followUs}
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-white/15 text-navy-foreground transition-colors hover:border-lime hover:bg-lime hover:text-lime-foreground focus-visible:ring-2 focus-visible:ring-lime focus-visible:outline-none"
                >
                  <Icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>
            </>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <LanguageSelector variant="dark" />
              <CurrencySelector variant="dark" />
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold tracking-[0.2em] text-navy-muted uppercase">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-navy-foreground/85 transition-colors hover:text-lime focus-visible:text-lime focus-visible:outline-none"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative mt-14 border-t border-white/10 pt-12">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.2em] text-navy-muted uppercase">
              {t.footer.contactTitle}
            </p>
            <a
              href={`mailto:${t.footer.email}`}
              className="group mt-3 inline-flex max-w-full items-center gap-3 font-display text-xl font-bold break-words transition-colors hover:text-lime focus-visible:text-lime focus-visible:outline-none sm:text-4xl lg:text-5xl"
            >
              {t.footer.email}
              <ArrowUpRight
                className="size-6 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 sm:size-8"
                aria-hidden
              />
            </a>
          </div>
        </div>


        <div className="relative mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-navy-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t.brand}. {t.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/privacy" className="transition-colors hover:text-lime">
              {t.footer.privacy}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-lime">
              {t.footer.terms}
            </Link>
            <Link to="/help" className="transition-colors hover:text-lime">
              {t.footer.help}
            </Link>
            <span className="font-semibold text-primary">
              Developed by BxBstudio
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
