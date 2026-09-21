import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currencies, useCurrency } from "@/i18n/CurrencyProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function CurrencySelector({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { currency, setCurrency } = useCurrency();
  const { t } = useLanguage();
  const active = currencies.find((c) => c.code === currency)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t.app.currency.change}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border py-2 pr-2.5 pl-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:outline-none",
          variant === "dark"
            ? "border-white/25 bg-white/15 text-white ring-offset-transparent backdrop-blur hover:bg-white/25"
            : "border-border bg-surface text-foreground hover:bg-secondary",
        )}
      >
        <span aria-hidden>{active.symbol}</span>
        <span>{active.code}</span>
        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t.app.currency.label}</DropdownMenuLabel>
        {currencies.map((c) => (
          <DropdownMenuItem key={c.code} onSelect={() => setCurrency(c.code)} className="cursor-pointer gap-2.5">
            <span aria-hidden className="w-8 text-sm font-semibold">{c.symbol}</span>
            <span className="flex-1">{c.code}</span>
            {c.code === currency ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
