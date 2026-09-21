import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageProvider";

type TurnstileCardProps = {
  /** Kept for API compatibility. The fake widget auto-verifies. */
  siteKey?: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  className?: string;
  /** Short label shown inside the widget, e.g. "Security check". */
  title?: string;
  /** Sentence shown beneath the label, e.g. "Verify you are human to continue." */
  description?: string;
  loadingLabel?: string;
};

const VERIFIED_LABELS: Record<string, string> = {
  en: "Verified",
  fr: "Vérifié",
  es: "Verificado",
  de: "Verifiziert",
  pt: "Verificado",
};

/**
 * Turnstile-styled verification card.
 *
 * Renders a compact, Cloudflare-Turnstile-looking widget that auto-verifies
 * immediately, then simply reads "Verified" in the active language. Swap in a
 * real Turnstile site key + secret to enable true bot protection.
 */
export function TurnstileCard({
  onVerify,
  onError,
  className,
}: TurnstileCardProps) {
  const { locale } = useLanguage();
  const [status] = useState<"checking" | "verified" | "failed">("verified");
  const verifyRef = useRef(onVerify);
  const errorRef = useRef(onError);
  verifyRef.current = onVerify;
  errorRef.current = onError;

  useEffect(() => {
    // Verify straight away — the check must never hold the form up.
    verifyRef.current(`fake-turnstile-${Date.now()}`);
  }, []);

  return (
    <div className={cn("w-full", className)} aria-live="polite" role="status">
      <div className="flex w-full items-center justify-between gap-3 rounded-md border border-black/15 bg-white px-3 py-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1a8f4c]">
            {status === "checking" ? (
              <svg className="size-3.5 animate-spin text-[#1a8f4c]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d="m5 13 4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="text-[13px] font-medium text-neutral-900">
            {VERIFIED_LABELS[locale] ?? VERIFIED_LABELS["en"]}
          </span>
        </div>

        <CloudflareMark className="h-[18px] w-auto" />
      </div>
    </div>
  );
}

function CloudflareMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 168 44" fill="none" aria-label="Cloudflare" role="img">
      {/* Cloud mark */}
      <g transform="translate(0 2)">
        <path
          d="M40.6 27.6H1.1c-.5 0-.9-.4-.9-.9 0-4.2 3.4-7.6 7.6-7.6h.1c.3-3.9 3.6-7 7.6-7 .7 0 1.3.1 2 .3 1.5-2.5 4.3-4.2 7.4-4.2 4.6 0 8.4 3.6 8.7 8.2 2.6.6 4.5 2.9 4.5 5.7v.4c1.5.4 2.6 1.6 2.9 3.2.1.9-.6 1.7-1.4 1.7z"
          fill="#f6821f"
        />
        <path
          d="M43.4 22.7c.3-1.2.2-2.3-.3-3.1-.5-.8-1.4-1.3-2.5-1.4l-19.8-.3c-.2 0-.3-.1-.4-.2-.1-.2-.1-.4 0-.5.1-.2.3-.3.5-.3l20-.3c2.4-.1 4.9-2 5.8-4.3l1.1-3c.1-.2.1-.3 0-.5C46.5 3.5 41.7.1 36.1.1c-5 0-9.3 2.8-11.5 6.9-1.6-1-3.6-1.5-5.7-1.3-3.7.4-6.6 3.3-7 7-.1.9 0 1.8.2 2.6-2.9 1.4-4.9 4.3-4.9 7.6 0 .3 0 .5.1.8 0 .2.1.2.3.2h34.8c.1 0 .3-.1.3-.2l1.6-4z"
          fill="#fbad41"
          opacity="0"
        />
      </g>
      {/* Wordmark */}
      <text
        x="46"
        y="29"
        fill="#231f20"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="17"
        fontWeight="700"
        letterSpacing="0.6"
      >
        CLOUDFLARE
      </text>
    </svg>
  );
}
