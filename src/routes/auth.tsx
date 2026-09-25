import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock, Mail, Phone, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import wallpaper from "@/assets/auth-wallpaper.jpg";
import { TurnstileCard } from "@/components/auth/TurnstileCard";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backendEnabled, remote } from "@/api/backend";
import { setPlatform } from "@/hooks/usePlatform";
import { pickCopy } from "@/i18n/copy";
import { interpolate, useLanguage } from "@/i18n/LanguageProvider";
import { verifyTurnstileToken } from "@/lib/turnstile.functions";
import type { Role } from "@/data/platform";
import { cn } from "@/lib/utils";
import { prepareAvatar } from "@/lib/images";

const TURNSTILE_SITE_KEY =
  import.meta.env["VITE_TURNSTILE_SITE_KEY"] ?? "1x00000000000000000000AA";

/** Only same-site paths are accepted as a post-sign-in destination. */
function safeRedirect(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = safeRedirect(search['redirect']);
    return redirect ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Sign in or create an account — RoomEasy" },
      {
        name: "description",
        content: "Access your RoomEasy trips, messages and host dashboard with one account.",
      },
      { property: "og:title", content: "Sign in or create an account — RoomEasy" },
      {
        property: "og:description",
        content: "One RoomEasy account to book stays and to publish your own place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const DIAL_CODES = [
  { code: "+33", label: "FR" },
  { code: "+216", label: "TN" },
  { code: "+32", label: "BE" },
  { code: "+41", label: "CH" },
  { code: "+44", label: "UK" },
  { code: "+1", label: "US" },
  { code: "+49", label: "DE" },
  { code: "+34", label: "ES" },
  { code: "+351", label: "PT" },
  { code: "+212", label: "MA" },
  { code: "+213", label: "DZ" },
] as const;

function AuthPage() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { redirect: returnTo } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+33");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("guest");
  const [pending, setPending] = useState<"signin" | "signup" | null>(null);
  const [signInToken, setSignInToken] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [welcome, setWelcome] = useState<string | null>(null);
  const [signUpToken, setSignUpToken] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<{ name: string; to: "/admin" | "/host" | "/trips" } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [photoPending, setPhotoPending] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const ph = pickCopy(locale, {
    en: { title: "Add a profile photo", hint: "Help hosts and guests recognise you. You can also do this later.", choose: "Choose a photo", other: "Choose another photo", save: "Save and continue", skip: "Skip for now" },
    fr: { title: "Ajoutez une photo de profil", hint: "Aidez les hôtes et les voyageurs à vous reconnaître. Vous pourrez aussi le faire plus tard.", choose: "Choisir une photo", other: "Choisir une autre photo", save: "Enregistrer et continuer", skip: "Passer pour l'instant" },
    es: { title: "Añade una foto de perfil", hint: "Ayuda a anfitriones y viajeros a reconocerte. También puedes hacerlo más tarde.", choose: "Elegir una foto", other: "Elegir otra foto", save: "Guardar y continuar", skip: "Omitir por ahora" },
    de: { title: "Profilfoto hinzufügen", hint: "Hilf Gastgebern und Gästen, dich zu erkennen. Du kannst das auch später tun.", choose: "Foto auswählen", other: "Anderes Foto wählen", save: "Speichern und weiter", skip: "Vorerst überspringen" },
    pt: { title: "Adicione uma foto de perfil", hint: "Ajude anfitriões e viajantes a reconhecê-lo. Também pode fazê-lo mais tarde.", choose: "Escolher uma foto", other: "Escolher outra foto", save: "Guardar e continuar", skip: "Ignorar por agora" },
  });

  const p = pickCopy(locale, {
    en: {
      phone: "Phone number",
      country: "Country code",
      placeholder: "6 12 34 56 78",
      hint: "We use it to confirm your bookings by SMS.",
      invalid: "Enter a valid phone number",
    },
    fr: {
      phone: "Numéro de téléphone",
      country: "Indicatif",
      placeholder: "6 12 34 56 78",
      hint: "Il sert à confirmer vos réservations par SMS.",
      invalid: "Saisissez un numéro de téléphone valide",
    },
    es: {
      phone: "Número de teléfono",
      country: "Prefijo",
      placeholder: "6 12 34 56 78",
      hint: "Lo usamos para confirmar tus reservas por SMS.",
      invalid: "Introduce un número de teléfono válido",
    },
    de: {
      phone: "Telefonnummer",
      country: "Vorwahl",
      placeholder: "6 12 34 56 78",
      hint: "Wir bestätigen damit Ihre Buchungen per SMS.",
      invalid: "Bitte eine gültige Telefonnummer eingeben",
    },
    pt: {
      phone: "Número de telefone",
      country: "Indicativo",
      placeholder: "6 12 34 56 78",
      hint: "Usamos para confirmar as suas reservas por SMS.",
      invalid: "Introduza um número de telefone válido",
    },
  });

  /** Shows a short welcome curtain, then lands the user on their first screen. */
  function enterApp(name: string, to: string) {
    setWelcome(name);
    window.setTimeout(() => void navigate({ to }), 1100);
  }

  async function signIn(displayName: string, created: boolean) {
    const token = created ? signUpToken : signInToken;
    const skipCheck = !created && otpStep;
    if (!token && !skipCheck) {
      toast.error("Please complete the security check first.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (created && digits.length < 6) {
      toast.error(p.invalid);
      return;
    }
    setPending(created ? "signup" : "signin");
    try {
      if (!skipCheck && token) await verifyTurnstileToken({ data: { token } });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Security check failed. Please try again.",
      );
      if (created) setSignUpToken(null);
      else setSignInToken(null);
      setPending(null);
      return;
    }
    const safeName = displayName.trim() || email.split("@")[0] || "Traveller";

    if (backendEnabled) {
      const session = created
        ? await remote.signUp(safeName, email.trim(), password, role === "host")
        : await remote.signIn(email.trim(), password, otpStep ? otp.trim() : undefined);
      setPending(null);
      if (session === "otp_required") {
        setOtpStep(true);
        toast.message("Enter the 6-digit code from your authenticator app.");
        return;
      }
      if (!session) return;
      if (created && digits) {
        const account = await remote.saveProfile({ phone: `${dialCode} ${digits}` });
        if (account) setPlatform((state) => ({
          session: state.session ? { ...state.session, ...(account.phone ? { phone: account.phone } : {}) } : state.session,
        }));
      }
      toast.success(
        created ? t.app.auth.created : interpolate(t.app.auth.signedIn, { name: session.name || safeName }),
      );
      const destination = (returnTo ??
        (session.role === "admin" ? "/admin" : session.role === "host" ? "/host" : "/trips")) as "/admin" | "/host" | "/trips";
      if (created) setNewAccount({ name: session.name || safeName, to: destination });
      else enterApp(session.name || safeName, destination);
      return;
    }
    setPending(null);
    toast.error("The account service is unavailable. Please try again later.");
  }

  async function chooseSignupPhoto(file?: File) {
    if (!file) return;
    try {
      setPhotoPreview(await prepareAvatar(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The image could not be prepared.");
    } finally {
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  async function finishSignup() {
    if (!newAccount || photoPending) return;
    setPhotoPending(true);
    if (photoPreview) {
      const account = await remote.saveAvatar(photoPreview);
      if (!account) {
        setPhotoPending(false);
        return;
      }
      setPlatform((state) => ({ session: state.session ? { ...state.session, ...(account.avatarUrl ? { avatarUrl: account.avatarUrl } : {}) } : null }));
    }
    enterApp(newAccount.name, newAccount.to);
  }

  if (newAccount) return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-navy px-5 py-10">
      {welcome ? <div className="fixed inset-0 z-50 grid place-items-center bg-navy/95"><p className="font-display text-2xl font-semibold text-navy-foreground">{interpolate(t.app.auth.signedIn, { name: welcome })}</p></div> : null}
      <img src={wallpaper} alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-navy/80" aria-hidden />
      <section className="w-full max-w-md rounded-[1.75rem] border border-border bg-surface p-7 text-center shadow-lift sm:p-9">
        <p className="text-xs font-semibold text-primary">2 / 2</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{ph.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{ph.hint}</p>
        <UserAvatar name={newAccount.name} src={photoPreview} className="mx-auto mt-7 size-28 text-4xl" />
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void chooseSignupPhoto(event.target.files?.[0])} />
        <Button type="button" variant="outline" className="mt-6 w-full rounded-full" onClick={() => photoInput.current?.click()} disabled={photoPending}>{photoPreview ? ph.other : ph.choose}</Button>
        <Button type="button" className="mt-3 w-full rounded-full" onClick={() => void finishSignup()} disabled={photoPending}>{photoPending ? <Loader2 className="size-4 animate-spin" /> : null}{photoPreview ? ph.save : ph.skip}</Button>
      </section>
    </main>
  );

  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-navy px-5 py-10">
      {welcome ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/95 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
          <div className="flex flex-col items-center gap-5 text-navy-foreground motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <span className="grid size-16 place-items-center rounded-full bg-lime text-lime-foreground">
              <Check className="size-8" aria-hidden />
            </span>
            <p className="font-display text-2xl font-semibold">{interpolate(t.app.auth.signedIn, { name: welcome })}</p>
            <span className="size-6 animate-spin rounded-full border-2 border-navy-foreground/30 border-t-navy-foreground" aria-hidden />
          </div>
        </div>
      ) : null}
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
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-foreground/75 transition-colors hover:text-navy-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t.nav.home}
          </Link>
        </div>

        <div className="mt-7 rounded-[1.75rem] border border-white/60 bg-surface/95 p-6 shadow-[0_2px_6px_rgb(0_0_0/0.08),0_48px_96px_-40px_rgb(0_0_0/0.7)] ring-1 ring-black/5 backdrop-blur-xl sm:p-9">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary p-1">
              <TabsTrigger
                value="signin"
                className="rounded-full font-semibold data-[state=active]:shadow-lift"
              >
                {t.app.auth.signIn}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-full font-semibold data-[state=active]:shadow-lift"
              >
                {t.app.auth.signUp}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-7">
              <div className="text-center">
                <h1 className="font-display text-[1.65rem] leading-snug font-extrabold tracking-tight">
                  {t.app.auth.welcome}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t.app.auth.intro}
                </p>
              </div>
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void signIn(email.split("@")[0] ?? "Traveller", false);
                }}
              >
                <Field
                  id="signin-email"
                  label={t.app.auth.email}
                  type="email"
                  autoComplete="email"
                  icon={Mail}
                  value={email}
                  onChange={setEmail}
                />
                <PasswordField
                  id="signin-password"
                  label={t.app.auth.password}
                  autoComplete="current-password"
                  value={password}
                  onChange={setPassword}
                />
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary underline underline-offset-4"
                  >
                    {t.app.auth.forgot}
                  </Link>
                </div>

                {otpStep ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-otp">Two-step code</Label>
                    <Input
                      id="signin-otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Open your authenticator app and type the current code.</p>
                  </div>
                ) : null}

                <TurnstileCard
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setSignInToken}
                  onError={() => toast.error(t.app.auth.securityCheckFailed)}
                  title={t.app.auth.securityCheck}
                  description={t.app.auth.securityCheckHint}
                  loadingLabel={t.app.auth.loading}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full font-bold shadow-lift transition-transform hover:scale-[1.01] active:scale-[0.98]"
                  disabled={pending === "signin" || (!signInToken && !otpStep)}
                >
                  {pending === "signin" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {t.app.auth.signIn}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-7">
              <div className="text-center">
                <h1 className="font-display text-[1.65rem] leading-snug font-extrabold tracking-tight">
                  {t.app.auth.signUp}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t.app.auth.createIntro}
                </p>
              </div>
              <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void signIn(name, true);
                }}
              >
                <Field
                  id="signup-name"
                  label={t.app.auth.name}
                  type="text"
                  autoComplete="name"
                  icon={UserRound}
                  value={name}
                  onChange={setName}
                />
                <Field
                  id="signup-email"
                  label={t.app.auth.email}
                  type="email"
                  autoComplete="email"
                  icon={Mail}
                  value={email}
                  onChange={setEmail}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone" className="text-[13px] font-semibold">
                    {p.phone}
                  </Label>
                  <div className="flex gap-2">
                    <select
                      aria-label={p.country}
                      value={dialCode}
                      onChange={(event) => setDialCode(event.target.value)}
                      className="h-12 rounded-xl border border-border/80 bg-secondary/40 px-3 text-sm font-semibold transition-all hover:border-foreground/25 focus-visible:bg-surface focus-visible:shadow-lift"
                    >
                      {DIAL_CODES.map((entry) => (
                        <option key={entry.label} value={entry.code}>
                          {entry.label} {entry.code}
                        </option>
                      ))}
                    </select>
                    <div className="group relative flex-1">
                      <Phone
                        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
                        aria-hidden
                      />
                      <Input
                        id="signup-phone"
                        type="tel"
                        inputMode="tel"
                        required
                        autoComplete="tel-national"
                        placeholder={p.placeholder}
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="h-12 rounded-xl border-border/80 bg-secondary/40 pl-11 transition-all placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:bg-surface focus-visible:shadow-lift"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{p.hint}</p>
                </div>

                <PasswordField
                  id="signup-password"
                  label={t.app.auth.password}
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                  showStrength
                />
                <div>
                  <p className="mb-2 text-sm font-medium">{t.app.auth.iAm}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["guest", t.app.auth.asGuest],
                        ["host", t.app.auth.asHost],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setRole(value)}
                        aria-pressed={role === value}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-all duration-200",
                          role === value
                            ? "border-primary bg-primary/10 text-primary shadow-lift"
                            : "border-border hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-secondary",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <TurnstileCard
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setSignUpToken}
                  onError={() => toast.error(t.app.auth.securityCheckFailed)}
                  title={t.app.auth.securityCheck}
                  description={t.app.auth.securityCheckHint}
                  loadingLabel={t.app.auth.loading}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full font-bold shadow-lift transition-transform hover:scale-[1.01] active:scale-[0.98]"
                  disabled={pending === "signup" || !signUpToken}
                >
                  {pending === "signup" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {t.app.auth.signUp}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t.app.auth.verifyEmail}
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  icon: typeof Mail;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </Label>
      <div className="group relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
          aria-hidden
        />
        <Input
          id={id}
          type={type}
          value={value}
          required
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-xl border-border/80 bg-secondary/40 pl-11 transition-all placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:bg-surface focus-visible:shadow-lift"
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showStrength = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const score = passwordScore(value);
  const { locale } = useLanguage();
  const c = pickCopy(locale, {
    en: {
      hide: "Hide password",
      show: "Show password",
      weak: "Weak",
      fair: "Fair",
      strong: "Strong",
    },
    fr: {
      hide: "Masquer le mot de passe",
      show: "Afficher le mot de passe",
      weak: "Faible",
      fair: "Moyen",
      strong: "Fort",
    },
    es: {
      hide: "Ocultar contraseña",
      show: "Mostrar contraseña",
      weak: "Débil",
      fair: "Media",
      strong: "Fuerte",
    },
    de: {
      hide: "Passwort verbergen",
      show: "Passwort anzeigen",
      weak: "Schwach",
      fair: "Mittel",
      strong: "Stark",
    },
    pt: {
      hide: "Ocultar palavra-passe",
      show: "Mostrar palavra-passe",
      weak: "Fraca",
      fair: "Média",
      strong: "Forte",
    },
  });

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </Label>
      <div className="group relative">
        <Lock
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
          aria-hidden
        />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          required
          minLength={showStrength ? 8 : undefined}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-xl border-border/80 bg-secondary/40 pr-12 pl-11 transition-all placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:bg-surface focus-visible:shadow-lift"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? c.hide : c.show}
          aria-pressed={visible}
          className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {showStrength && value ? (
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  score >= step
                    ? score === 1
                      ? "bg-destructive"
                      : score === 2
                        ? "bg-accent"
                        : "bg-primary"
                    : "bg-border",
                )}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {score <= 1 ? c.weak : score === 2 ? c.fair : c.strong}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^\w\s]/.test(value)) score += 1;
  return score;
}
