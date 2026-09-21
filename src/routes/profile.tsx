import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarCheck,
  Camera,
  CheckCircle2,
  Heart,
  KeyRound,
  LifeBuoy,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import coverImg from "@/assets/profile-cover.jpg";
import { AccountShell } from "@/components/layout/AccountShell";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useFavorites } from "@/hooks/useFavorites";
import { remote } from "@/api/backend";
import { setPlatform, usePlatform } from "@/hooks/usePlatform";
import { useLanguage } from "@/i18n/LanguageProvider";
import { pickCopy } from "@/i18n/copy";
import { prepareAvatar } from "@/lib/images";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Your profile — RoomEasy" },
      {
        name: "description",
        content:
          "Update your RoomEasy name, contact details, language, currency and security preferences.",
      },
      { property: "og:title", content: "Your profile — RoomEasy" },
      {
        property: "og:description",
        content: "Name, contact details, language, currency and security preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, locale } = useLanguage();
  const { session, bookings, threads } = usePlatform();
  const { favorites } = useFavorites();
  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [phone, setPhone] = useState(session?.phone ?? "");
  const [twoFactor, setTwoFactor] = useState(session?.twoFactorEnabled ?? false);
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const d = useDeleteCopy();
  const photoInput = useRef<HTMLInputElement>(null);

  // The session arrives after the account is loaded from the server, so keep
  // the form in step with it instead of freezing the first (empty) render.
  useEffect(() => {
    if (!session) return;
    setName(session.name ?? "");
    setEmail(session.email ?? "");
    setPhone(session.phone ?? "");
    setTwoFactor(session.twoFactorEnabled ?? false);
  }, [session?.name, session?.email, session?.phone, session?.twoFactorEnabled]);

  // Two-step sign-in is only switched once the server confirms it.
  async function changeTwoFactor(next: boolean) {
    if (!session || twoFactorBusy) return;
    setTwoFactorBusy(true);
    const account = await remote.setTwoFactor(next);
    if (account) {
      setTwoFactor(account.twoFactorEnabled);
      setPlatform({ session: { ...session, twoFactorEnabled: account.twoFactorEnabled } });
      toast.success(t.app.profile.saved);
    }
    setTwoFactorBusy(false);
  }


  const pc = pickCopy(locale, {
    en: { phone: "Phone number", placeholder: "+33 6 12 34 56 78", remove: "Remove photo", photoSaved: "Profile photo updated" },
    fr: { phone: "Numéro de téléphone", placeholder: "+33 6 12 34 56 78", remove: "Supprimer la photo", photoSaved: "Photo de profil mise à jour" },
    es: { phone: "Número de teléfono", placeholder: "+34 612 34 56 78", remove: "Eliminar foto", photoSaved: "Foto de perfil actualizada" },
    de: { phone: "Telefonnummer", placeholder: "+49 151 23456789", remove: "Foto entfernen", photoSaved: "Profilfoto aktualisiert" },
    pt: { phone: "Número de telefone", placeholder: "+351 912 345 678", remove: "Remover foto", photoSaved: "Foto de perfil atualizada" },
  });

  async function changePhoto(file?: File) {
    if (!file || !session) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await prepareAvatar(file);
      const account = await remote.saveAvatar(dataUrl);
      if (!account) return;
      setPlatform({ session: { ...session, ...(account.avatarUrl ? { avatarUrl: account.avatarUrl } : {}) } });
      toast.success(pc.photoSaved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The profile photo could not be saved.");
    } finally {
      setPhotoBusy(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  async function removePhoto() {
    if (!session || !session.avatarUrl || photoBusy) return;
    setPhotoBusy(true);
    const account = await remote.removeAvatar();
    if (account) {
      const { avatarUrl: _removed, ...withoutAvatar } = session;
      setPlatform({ session: withoutAvatar });
      toast.success(pc.photoSaved);
    }
    setPhotoBusy(false);
  }

  const stats = [
    {
      icon: CalendarCheck,
      label: t.app.trips.title,
      value: bookings.length,
      to: "/trips" as const,
    },
    {
      icon: Heart,
      label: t.app.favourites.title,
      value: favorites.length,
      to: "/favourites" as const,
    },
    {
      icon: MessageSquare,
      label: t.app.messages.title,
      value: threads.length,
      to: "/messages" as const,
    },
  ];

  const p = t.app.profile;

  return (
    <AccountShell>
      <div className="mx-auto max-w-6xl pb-8">
        {/* Cover header */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="relative h-36 sm:h-48">
            <img
              src={coverImg}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/40 to-transparent" />
            <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void changePhoto(event.target.files?.[0])} />
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full backdrop-blur"
                onClick={() => photoInput.current?.click()}
                disabled={photoBusy}
              >
                <Camera className="size-4" aria-hidden />
                {p.changePhoto}
              </Button>
              {session?.avatarUrl ? <Button size="sm" variant="secondary" className="rounded-full backdrop-blur" onClick={() => void removePhoto()} disabled={photoBusy}>{pc.remove}</Button> : null}
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6">
              <div className="relative shrink-0">
                <UserAvatar name={session?.name ?? p.title} src={session?.avatarUrl} className="size-24 border-4 border-card shadow-sm sm:size-28" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => photoInput.current?.click()}
                  disabled={photoBusy}
                  aria-label={p.changePhoto}
                  className="absolute right-1 bottom-1 size-8 rounded-full bg-card"
                >
                  <Camera className="size-4" aria-hidden />
                </Button>
              </div>

              <div className="min-w-0 flex-1 sm:pb-2">
                <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
                  <span className="truncate">{session?.name ?? p.title}</span>
                  {session?.verified ? (
                    <ShieldCheck className="size-5 text-primary" aria-hidden />
                  ) : null}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" aria-hidden />
                    {session?.email ?? "—"}
                  </span>
                  {session?.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" aria-hidden />
                      {session.phone}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full border-0 bg-primary/10 text-[0.65rem] font-semibold tracking-[0.14em] text-primary uppercase"
                  >
                    {session?.role === "host" ? p.hostBadge : (session?.role ?? "guest")}
                  </Badge>
                  {session?.verified ? (
                    <Badge className="rounded-full border-0 bg-emerald-500/15 text-[0.65rem] font-semibold tracking-[0.14em] text-emerald-700 uppercase">
                      {t.app.auth.verified}
                    </Badge>
                  ) : (
                    <Badge className="rounded-full border-0 bg-amber-500/15 text-[0.65rem] font-semibold tracking-[0.14em] text-amber-700 uppercase">
                      {t.app.auth.verifyEmail}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
          {stats.map(({ icon: Icon, label, value, to }) => (
            <Link
              key={label}
              to={to}
              className="group min-w-0 rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm sm:p-5"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-[0.62rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase sm:text-[0.68rem] sm:tracking-[0.16em]">
                  {label}
                </span>
                <span className="hidden size-9 place-items-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:grid">
                  <Icon className="size-4" aria-hidden />
                </span>
              </span>
              <span className="mt-2 block font-display text-2xl font-semibold tabular-nums sm:mt-3 sm:text-3xl">
                {value}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* Left column */}
          <div className="space-y-6">
            {/* Personal information */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!session) return;
                const account = await remote.saveProfile({ fullName: name, phone: phone || null });
                if (!account) return;
                setPlatform({
                  session: {
                    ...session,
                    name: account.fullName,
                    ...(account.phone ? { phone: account.phone } : {}),
                    ...(account.avatarUrl ? { avatarUrl: account.avatarUrl } : {}),
                  },
                });
                toast.success(p.saved);
              }}
               className="space-y-6 rounded-xl border border-border bg-card p-5 sm:p-7"
            >
              <div className="border-b border-border pb-4">
                <h2 className="font-display text-lg font-semibold">{p.personalInfo}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.personalInfoDesc}</p>
              </div>

              {session?.verified ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
                  <p className="text-sm font-medium text-emerald-800">{p.emailVerifiedBox}</p>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <Mail className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
                  <p className="text-sm font-medium text-amber-800">{t.app.auth.verifyEmail}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs tracking-[0.1em] uppercase">
                    {p.fullName}
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs tracking-[0.1em] uppercase">
                    {p.emailAddress}
                  </Label>
                  {/* The address identifies the account, so only the server can
                      change it — showing it editable would promise otherwise. */}
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone" className="text-xs tracking-[0.1em] uppercase">
                    {pc.phone}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={pc.placeholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>

              <Button type="submit" className="rounded-full px-6">
                {p.save}
              </Button>
            </form>

            {/* Account settings */}
             <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
              <div className="border-b border-border pb-4">
                <h2 className="font-display text-lg font-semibold">{p.accountSettings}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.accountSettingsDesc}</p>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="flex items-center gap-3 text-sm">
                    <span className="grid size-9 place-items-center rounded-full bg-secondary text-primary">
                      <Sparkles className="size-4" aria-hidden />
                    </span>
                    {p.languageRegion}
                  </span>
                  <LanguageSelector />
                </div>
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="flex items-center gap-3 text-sm">
                    <span className="grid size-9 place-items-center rounded-full bg-secondary text-primary">
                      <span className="text-xs font-semibold">€</span>
                    </span>
                    {p.currency}
                  </span>
                  <CurrencySelector />
                </div>
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="flex items-center gap-3 text-sm">
                    <span className="grid size-9 place-items-center rounded-full bg-secondary text-primary">
                      <KeyRound className="size-4" aria-hidden />
                    </span>
                    {p.password}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setPasswordOpen(true)}
                  >
                    {p.password}
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-3 py-4">
                  <span className="flex items-center gap-3 text-sm">
                    <span className="grid size-9 place-items-center rounded-full bg-secondary text-primary">
                      <ShieldCheck className="size-4" aria-hidden />
                    </span>
                    {p.twoFactor}
                  </span>
                  <Switch
                    checked={twoFactor}
                    disabled={twoFactorBusy}
                    onCheckedChange={(v) => void changeTwoFactor(v)}
                    aria-label={p.twoFactor}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Account status */}
             <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-emerald-500/20 text-emerald-700">
                  <CheckCircle2 className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-[0.68rem] font-semibold tracking-[0.16em] text-emerald-700 uppercase">
                    {p.accountStatus}
                  </h2>
                  <p className="font-display text-lg font-semibold text-emerald-800">{p.allGood}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-emerald-800/80">{p.accountStatusDesc}</p>
            </section>

            {/* Quick actions */}
             <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {p.quickActions}
              </h2>
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-xl"
                  onClick={() => {
                    document.getElementById("name")?.focus();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Pencil className="size-4" aria-hidden />
                  {p.editProfile}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-xl"
                  onClick={() => setPasswordOpen(true)}
                >
                  <KeyRound className="size-4" aria-hidden />
                  {p.password}
                </Button>
              </div>
            </section>

            {/* Security */}
             <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {p.security}
              </h2>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
                  {p.twoFactor}
                </span>
                <Badge
                  className={
                    twoFactor
                      ? "rounded-full border-0 bg-emerald-500/15 text-[0.65rem] font-semibold tracking-[0.14em] text-emerald-700 uppercase"
                      : "rounded-full border-0 bg-secondary text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
                  }
                >
                  {twoFactor ? t.app.profile.saved : t.app.auth.verified}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.twoFactorDesc}</p>
              <div className="mt-4">
                <Switch
                  checked={twoFactor}
                  disabled={twoFactorBusy}
                  onCheckedChange={(v) => void changeTwoFactor(v)}
                  aria-label={p.twoFactor}
                />
              </div>
            </section>

            {/* Need help */}
            <section className="overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <LifeBuoy className="size-5" aria-hidden />
                </span>
                <h2 className="font-display text-lg font-semibold text-primary">{p.needHelp}</h2>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.needHelpDesc}</p>
              <Button className="mt-4 w-full rounded-full" asChild>
                <Link to="/help">{p.contactSupport}</Link>
              </Button>
            </section>
          </div>
        </div>

        {/* Danger zone — permanent erasure of the account (GDPR) */}
        <section className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" aria-hidden />
            </span>
            <h2 className="font-display text-lg font-semibold text-destructive">{d.title}</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{d.intro}</p>
          <Button variant="destructive" className="mt-4 rounded-full" onClick={() => setDeleteOpen(true)}>
            {d.action}
          </Button>
        </section>
      </div>
      <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </AccountShell>
  );
}

/** Copy for the erasure flow, in the five languages the app ships. */
function useDeleteCopy() {
  const { locale } = useLanguage();
  return pickCopy(locale, {
    en: {
      title: "Delete my account",
      intro:
        "Your personal details are erased for good: name, email, phone, photo, password, saved stays and team invitations. Past bookings and reviews stay in the records without your name. This cannot be undone.",
      action: "Delete my account",
      confirmTitle: "Delete your account?",
      password: "Your password",
      reason: "Why are you leaving? (optional)",
      typed: "Type DELETE to confirm",
      keyword: "DELETE",
      keywordError: "Type DELETE to confirm.",
      cancel: "Cancel",
      submit: "Delete for good",
      done: "Your account has been deleted.",
    },
    fr: {
      title: "Supprimer mon compte",
      intro:
        "Vos données personnelles sont effacées définitivement : nom, e-mail, téléphone, photo, mot de passe, séjours enregistrés et invitations d'équipe. Les réservations et avis passés restent dans les registres, sans votre nom. Action irréversible.",
      action: "Supprimer mon compte",
      confirmTitle: "Supprimer votre compte ?",
      password: "Votre mot de passe",
      reason: "Pourquoi partez-vous ? (facultatif)",
      typed: "Tapez SUPPRIMER pour confirmer",
      keyword: "SUPPRIMER",
      keywordError: "Tapez SUPPRIMER pour confirmer.",
      cancel: "Annuler",
      submit: "Supprimer définitivement",
      done: "Votre compte a été supprimé.",
    },
    es: {
      title: "Eliminar mi cuenta",
      intro:
        "Tus datos personales se borran para siempre: nombre, correo, teléfono, foto, contraseña, estancias guardadas e invitaciones de equipo. Las reservas y reseñas pasadas se conservan sin tu nombre. No se puede deshacer.",
      action: "Eliminar mi cuenta",
      confirmTitle: "¿Eliminar tu cuenta?",
      password: "Tu contraseña",
      reason: "¿Por qué te vas? (opcional)",
      typed: "Escribe ELIMINAR para confirmar",
      keyword: "ELIMINAR",
      keywordError: "Escribe ELIMINAR para confirmar.",
      cancel: "Cancelar",
      submit: "Eliminar definitivamente",
      done: "Tu cuenta ha sido eliminada.",
    },
    de: {
      title: "Mein Konto löschen",
      intro:
        "Ihre persönlichen Daten werden endgültig gelöscht: Name, E-Mail, Telefon, Foto, Passwort, gespeicherte Unterkünfte und Team-Einladungen. Frühere Buchungen und Bewertungen bleiben ohne Ihren Namen erhalten. Nicht umkehrbar.",
      action: "Mein Konto löschen",
      confirmTitle: "Konto wirklich löschen?",
      password: "Ihr Passwort",
      reason: "Warum gehen Sie? (optional)",
      typed: "Tippen Sie LÖSCHEN zur Bestätigung",
      keyword: "LÖSCHEN",
      keywordError: "Tippen Sie LÖSCHEN zur Bestätigung.",
      cancel: "Abbrechen",
      submit: "Endgültig löschen",
      done: "Ihr Konto wurde gelöscht.",
    },
    pt: {
      title: "Eliminar a minha conta",
      intro:
        "Os seus dados pessoais são apagados para sempre: nome, e-mail, telefone, foto, palavra-passe, estadias guardadas e convites de equipa. Reservas e avaliações antigas ficam nos registos sem o seu nome. Não pode ser revertido.",
      action: "Eliminar a minha conta",
      confirmTitle: "Eliminar a sua conta?",
      password: "A sua palavra-passe",
      reason: "Porque está a sair? (opcional)",
      typed: "Escreva ELIMINAR para confirmar",
      keyword: "ELIMINAR",
      keywordError: "Escreva ELIMINAR para confirmar.",
      cancel: "Cancelar",
      submit: "Eliminar definitivamente",
      done: "A sua conta foi eliminada.",
    },
  });
}

/** Asks for the password and an explicit keyword, then erases and signs out. */
function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const d = useDeleteCopy();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (typed.trim().toUpperCase() !== d.keyword) {
      toast.error(d.keywordError);
      return;
    }
    setBusy(true);
    const done = await remote.deleteAccount(password, reason.trim() || undefined);
    setBusy(false);
    if (!done) return;
    toast.success(d.done);
    onOpenChange(false);
    remote.signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{d.confirmTitle}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <p className="text-sm text-muted-foreground">{d.intro}</p>
          <div className="space-y-2">
            <Label htmlFor="delete-password">{d.password}</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-reason">{d.reason}</Label>
            <Input id="delete-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-keyword">{d.typed}</Label>
            <Input
              id="delete-keyword"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={d.keyword}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {d.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={busy}>
              {d.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


/** Changes the password through the server; nothing is claimed until it accepts. */
function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { locale } = useLanguage();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const c = pickCopy(locale, {
    en: {
      title: "Change password",
      current: "Current password",
      next: "New password",
      confirm: "Confirm new password",
      mismatch: "The two new passwords do not match.",
      short: "Use at least 8 characters.",
      done: "Your password has been changed.",
      save: "Change password",
      cancel: "Cancel",
    },
    fr: {
      title: "Changer le mot de passe",
      current: "Mot de passe actuel",
      next: "Nouveau mot de passe",
      confirm: "Confirmer le nouveau mot de passe",
      mismatch: "Les deux nouveaux mots de passe ne correspondent pas.",
      short: "Utilisez au moins 8 caractères.",
      done: "Votre mot de passe a été changé.",
      save: "Changer le mot de passe",
      cancel: "Annuler",
    },
    es: {
      title: "Cambiar contraseña",
      current: "Contraseña actual",
      next: "Nueva contraseña",
      confirm: "Confirmar la nueva contraseña",
      mismatch: "Las dos contraseñas nuevas no coinciden.",
      short: "Usa al menos 8 caracteres.",
      done: "Tu contraseña ha sido cambiada.",
      save: "Cambiar contraseña",
      cancel: "Cancelar",
    },
    de: {
      title: "Passwort ändern",
      current: "Aktuelles Passwort",
      next: "Neues Passwort",
      confirm: "Neues Passwort bestätigen",
      mismatch: "Die beiden neuen Passwörter stimmen nicht überein.",
      short: "Mindestens 8 Zeichen verwenden.",
      done: "Ihr Passwort wurde geändert.",
      save: "Passwort ändern",
      cancel: "Abbrechen",
    },
    pt: {
      title: "Alterar palavra-passe",
      current: "Palavra-passe atual",
      next: "Nova palavra-passe",
      confirm: "Confirmar a nova palavra-passe",
      mismatch: "As duas novas palavras-passe não coincidem.",
      short: "Use pelo menos 8 caracteres.",
      done: "A sua palavra-passe foi alterada.",
      save: "Alterar palavra-passe",
      cancel: "Cancelar",
    },
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (next.length < 8) {
      toast.error(c.short);
      return;
    }
    if (next !== confirm) {
      toast.error(c.mismatch);
      return;
    }
    setBusy(true);
    const accepted = await remote.changePassword(current, next);
    setBusy(false);
    if (!accepted) return;
    toast.success(c.done);
    setCurrent("");
    setNext("");
    setConfirm("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="current-password">{c.current}</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{c.next}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{c.confirm}</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {c.cancel}
            </Button>
            <Button type="submit" disabled={busy}>
              {c.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
