import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { request } from "@/api/http/client";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

const COPY = {
  en: { checking: "Confirming your email address…", ok: "Your email address is confirmed.", fail: "This confirmation link is invalid or has expired. Sign in to receive a new one.", home: "Go to RoomEasy" },
  fr: { checking: "Confirmation de votre adresse e-mail…", ok: "Votre adresse e-mail est confirmée.", fail: "Ce lien de confirmation est invalide ou a expiré. Connectez-vous pour en recevoir un nouveau.", home: "Aller sur RoomEasy" },
  es: { checking: "Confirmando tu correo electrónico…", ok: "Tu correo electrónico está confirmado.", fail: "Este enlace no es válido o ha caducado. Inicia sesión para recibir uno nuevo.", home: "Ir a RoomEasy" },
  de: { checking: "E-Mail-Adresse wird bestätigt…", ok: "Deine E-Mail-Adresse ist bestätigt.", fail: "Dieser Bestätigungslink ist ungültig oder abgelaufen. Melde dich an, um einen neuen zu erhalten.", home: "Zu RoomEasy" },
  pt: { checking: "A confirmar o seu e-mail…", ok: "O seu e-mail está confirmado.", fail: "Este link é inválido ou expirou. Inicie sessão para receber um novo.", home: "Ir para RoomEasy" },
} as const;

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Confirm your email — RoomEasy" },
      { name: "description", content: "Confirm the email address of your RoomEasy account." },
      { property: "og:title", content: "Confirm your email — RoomEasy" },
      { property: "og:description", content: "Confirm the email address of your RoomEasy account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const { locale } = useLanguage();
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const [state, setState] = useState<"checking" | "ok" | "fail">("checking");
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (!token) {
      setState("fail");
      return;
    }
    request("/accounts/verify-email", { method: "POST", body: { token } })
      .then(() => setState("ok"))
      .catch(() => setState("fail"));
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        {state === "checking" ? (
          <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden />
        ) : state === "ok" ? (
          <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden />
        ) : (
          <XCircle className="mx-auto size-10 text-destructive" aria-hidden />
        )}
        <p className="text-base font-medium" role="status">
          {c[state]}
        </p>
        {state === "checking" ? null : (
          <Button asChild className="w-full">
            <Link to="/">{c.home}</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
