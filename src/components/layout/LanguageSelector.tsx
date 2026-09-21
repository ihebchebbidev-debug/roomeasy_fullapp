import { Check, ChevronDown } from "lucide-react";

import flagDe from "@/assets/flag-de.jpg";
import flagEn from "@/assets/flag-en.jpg";
import flagEs from "@/assets/flag-es.jpg";
import flagFr from "@/assets/flag-fr.jpg";
import flagPt from "@/assets/flag-pt.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageProvider";
import { locales, type Locale } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const flags: Record<Locale, string> = { en: flagEn, fr: flagFr, es: flagEs, de: flagDe, pt: flagPt };

function Flag({ code, label, className }: { code: Locale; label: string; className?: string }) {
  return (
    <img
      src={flags[code]}
      alt={label}
      loading="lazy"
      width={512}
      height={512}
      className={cn("rounded-full object-cover ring-1 ring-black/10", className)}
    />
  );
}

export function LanguageSelector({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale, t } = useLanguage();
  const active = locales.find((l) => l.code === locale) ?? locales[0];

  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t.language.change} — ${active.label}`}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border py-2 pr-2.5 pl-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:outline-none",
          variant === "dark"
            ? "border-white/25 bg-white/15 text-white ring-offset-transparent backdrop-blur hover:bg-white/25"
            : "border-border bg-surface text-foreground hover:bg-secondary",
        )}
      >
        <Flag code={active.code} label="" className="size-5" />
        <span>{active.short}</span>
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t.language.label}</DropdownMenuLabel>
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLocale(l.code)}
            className="cursor-pointer gap-2.5"
          >
            <Flag code={l.code} label={l.label} className="size-6" />
            <span className="flex-1">{l.label}</span>
            {l.code === locale ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
