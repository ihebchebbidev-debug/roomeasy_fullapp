import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { remote } from "@/api/backend";
import { ArrowLeft, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import wallpaper from "@/assets/auth-wallpaper.jpg";
import { TurnstileCard } from "@/components/auth/TurnstileCard";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyTurnstileToken } from "@/lib/turnstile.functions";
import { useLanguage } from "@/i18n/LanguageProvider";

const TURNSTILE_SITE_KEY =
  import.meta.env["VITE_TURNSTILE_SITE_KEY"] ?? "1x00000000000000000000AA";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Reset your password — RoomEasy" },
      {
        name: "description",
        content: "Get a 4-digit verification code to reset your RoomEasy password.",
      },
      { property: "og:title", content: "Reset your password — RoomEasy" },
      {
        property: "og:description",
        content: "Get a 4-digit verification code to reset your RoomEasy password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

type Step = "email" | "code" | "password";

function ForgotPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [ticket, setTicket] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  async function sendCode(silent = false) {
    setPending(true);
    try {
      const answer = await remote.forgotPassword(email.trim());
      if (!answer) return false;
      if (!silent) toast.success(answer.message);
      else toast.success("A new code is on its way.");
      // Before the mailbox is connected the server hands the code back so the
      // flow can still be completed.
      if (answer.devCode) setDigits(answer.devCode.split(""));
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!captcha) {
      toast.error(t.app.auth.securityCheckRequired);
      return;
    }
    setPending(true);
    try {
      await verifyTurnstileToken({ data: { token: captcha } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.app.auth.securityCheckFailed);
      setCaptcha(null);
      setPending(false);
      return;
    }
    setPending(false);
    if (await sendCode()) {
      setStep("code");
      setTimeout(() => boxes.current[0]?.focus(), 60);
    } else {
      setCaptcha(null);
    }
  }

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((digit, i) => (i === index ? clean : digit)));
    if (clean && index < 3) boxes.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) boxes.current[index - 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    event.preventDefault();
    setDigits(["", "", "", ""].map((_, i) => pasted[i] ?? ""));
    boxes.current[Math.min(pasted.length, 3)]?.focus();
  }

  async function handleCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 4) {
      toast.error("Enter the 4-digit code from your email.");
      return;
    }
    setPending(true);
    try {
      const answer = await remote.verifyResetCode(email.trim(), code);
      if (!answer) return;
      setTicket(answer.token);
      setStep("password");
    } finally {
      setPending(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      const answer = await remote.resetPassword(ticket, password);
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
        className="absolute inset-0 -z-20 size-full scale-105 object-cover motion-safe:animate-[authpan_28s_ease-in-out_infinite_alternate]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--navy)_55%,transparent),color-mix(in_oklab,var(--navy)_94%,transparent))]"
      />

      <div className="w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="flex flex-col items-center gap-4 text-navy-foreground">
          <BrandLogo inverted className="h-12" />
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-foreground/75 transition-colors hover:text-navy-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t.app.auth.haveAccount}
          </Link>
        </div>

        <div className="mt-7 rounded-[1.75rem] border border-white/60 bg-surface/95 p-6 shadow-[0_2px_6px_rgb(0_0_0/0.08),0_48px_96px_-40px_rgb(0_0_0/0.7)] ring-1 ring-black/5 backdrop-blur-xl sm:p-9">
          <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
            {(["email", "code", "password"] as Step[]).map((name, index) => (
              <span
                key={name}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (step === name
                    ? "w-8 bg-primary"
                    : index < (["email", "code", "password"] as Step[]).indexOf(step)
                      ? "w-5 bg-primary/50"
                      : "w-5 bg-border")
                }
              />
            ))}
          </div>

          {step === "email" ? (
            <>
              <div className="text-center">
                <h1 className="font-display text-[1.65rem] leading-snug font-extrabold tracking-tight">
                  {t.app.auth.forgotTitle}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Enter your email and we will send you a 4-digit verification code.
                </p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={handleEmail}>
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-[13px] font-semibold">
                    {t.app.auth.email}
                  </Label>
                  <div className="group relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                      aria-hidden
                    />
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 rounded-xl border-border/80 bg-secondary/40 pl-11 transition-all placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:bg-surface focus-visible:shadow-lift"
                    />
                  </div>
                </div>

                <TurnstileCard
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setCaptcha}
                  onError={() => toast.error(t.app.auth.securityCheckFailed)}
                  title={t.app.auth.securityCheck}
                  description={t.app.auth.securityCheckHint}
                  loadingLabel={t.app.auth.loading}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full font-bold shadow-lift transition-transform hover:scale-[1.01] active:scale-[0.98]"
                  disabled={pending || !captcha}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Send code
                </Button>
              </form>
            </>
          ) : null}

          {step === "code" ? (
            <>
              <div className="text-center">
                <ShieldCheck className="mx-auto size-11 text-primary" aria-hidden />
                <h1 className="mt-4 font-display text-[1.65rem] leading-snug font-extrabold tracking-tight">
                  Enter your code
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  We sent a 4-digit code to <span className="font-semibold text-foreground">{email}</span>. It expires
                  in 15 minutes.
                </p>
              </div>
              <form className="mt-6 space-y-5" onSubmit={handleCode}>
                <div className="flex justify-center gap-3">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        boxes.current[index] = element;
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-label={`Digit ${index + 1}`}
                      maxLength={1}
                      value={digit}
                      onChange={(event) => setDigit(index, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(index, event)}
                      onPaste={handlePaste}
                      className="size-14 rounded-2xl border border-border/80 bg-secondary/40 text-center font-display text-2xl font-extrabold outline-none transition-all focus:border-primary focus:bg-surface focus:shadow-lift"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full font-bold shadow-lift"
                  disabled={pending || code.length !== 4}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Verify code
                </Button>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => {
                      setDigits(["", "", "", ""]);
                      setStep("email");
                    }}
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    className="text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                    disabled={pending}
                    onClick={() => void sendCode(true)}
                  >
                    Resend code
                  </button>
                </div>
              </form>
            </>
          ) : null}

          {step === "password" ? (
            <>
              <div className="text-center">
                <h1 className="font-display text-[1.65rem] leading-snug font-extrabold tracking-tight">
                  Set a new password
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Choose a new password for your account.
                </p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={handlePassword}>
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
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
