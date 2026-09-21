import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { remote } from "@/api/backend";
import wallpaper from "@/assets/auth-wallpaper.jpg";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Set a new password — RoomEasy" },
      {
        name: "description",
        content: "Choose a new password for your RoomEasy account.",
      },
      { property: "og:title", content: "Set a new password — RoomEasy" },
      {
        property: "og:description",
        content: "Choose a new password for your RoomEasy account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      toast.error("This reset link is invalid or has expired.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const answer = await remote.resetPassword(token, password);
      if (!answer) return;
      toast.success(answer.message || "Your password has been changed.");
      navigate({ to: "/auth" });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-navy px-5 py-10">
      <img
        src={wallpaper}
        alt=""
        aria-hidden
        width={1536}
        height={1920}
        className="absolute inset-0 -z-20 size-full scale-105 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--navy)_55%,transparent),color-mix(in_oklab,var(--navy)_94%,transparent))]"
      />

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4 text-navy-foreground">
          <BrandLogo inverted className="h-12" />
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-foreground/75 transition-colors hover:text-navy-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t.app.auth.signIn}
          </Link>
        </div>

        <div className="mt-7 rounded-[1.75rem] border border-white/60 bg-surface/95 p-6 shadow-[0_2px_6px_rgb(0_0_0/0.08),0_48px_96px_-40px_rgb(0_0_0/0.7)] ring-1 ring-black/5 backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <h1 className="font-display text-[1.65rem] leading-snug font-extrabold tracking-tight">
              Set a new password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {token
                ? "Choose a new password for your account."
                : "This reset link is invalid or has expired. Request a new one."}
            </p>
          </div>

          {token ? (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-[13px] font-semibold">
                  {t.app.auth.password}
                </Label>
                <div className="group relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                    aria-hidden
                  />
                  <Input
                    id="new-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-xl border-border/80 bg-secondary/40 pl-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-[13px] font-semibold">
                  Confirm password
                </Label>
                <div className="group relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                    aria-hidden
                  />
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className="h-12 rounded-xl border-border/80 bg-secondary/40 pl-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full font-bold shadow-lift"
                disabled={pending}
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Change password
              </Button>
            </form>
          ) : (
            <Button asChild className="mt-6 w-full rounded-full font-bold" size="lg">
              <Link to="/forgot-password">{t.app.auth.resetButton}</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
