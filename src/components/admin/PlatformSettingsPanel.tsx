import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, CreditCard, Eye, EyeOff, Mail, Percent, Share2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { settingsApi, SOCIAL_KEYS, type IntegrationViewDto, type SocialKey, type SocialLinksDto } from "@/api/http/platform.http";
import { useLanguage } from "@/i18n/LanguageProvider";

type Field = { key: string; label: [string, string]; type?: "text" | "password" | "number" | "select"; options?: string[]; placeholder?: string };

const EMAIL_FIELDS: Field[] = [
  { key: "SMTP_HOST", label: ["Serveur SMTP", "SMTP server"], placeholder: "smtp.example.com" },
  { key: "SMTP_PORT", label: ["Port", "Port"], type: "number", placeholder: "465" },
  { key: "SMTP_SECURE", label: ["Connexion sécurisée (SSL)", "Secure connection (SSL)"], type: "select", options: ["true", "false"] },
  { key: "SMTP_USER", label: ["Identifiant", "Username"] },
  { key: "SMTP_PASSWORD", label: ["Mot de passe", "Password"], type: "password" },
  { key: "MAIL_FROM_ADDRESS", label: ["Adresse d'envoi", "Sender address"], placeholder: "no-reply@example.com" },
  { key: "MAIL_FROM_NAME", label: ["Nom d'envoi", "Sender name"] },
  { key: "MAIL_REPLY_TO", label: ["Adresse de réponse", "Reply-to address"] },
  { key: "MAIL_DRY_RUN", label: ["Mode test (n'envoie rien)", "Test mode (sends nothing)"], type: "select", options: ["false", "true"] },
];

const STRIPE_FIELDS: Field[] = [
  { key: "STRIPE_PUBLISHABLE_KEY", label: ["Clé publique", "Publishable key"], placeholder: "pk_live_..." },
  { key: "STRIPE_SECRET_KEY", label: ["Clé secrète", "Secret key"], type: "password", placeholder: "sk_live_..." },
  { key: "STRIPE_WEBHOOK_SECRET", label: ["Secret du webhook", "Webhook secret"], type: "password", placeholder: "whsec_..." },
  { key: "STRIPE_CONNECT_COUNTRY", label: ["Pays Stripe Connect", "Stripe Connect country"], placeholder: "FR" },
];

const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: "Instagram", x: "X (Twitter)", facebook: "Facebook", linkedin: "LinkedIn", tiktok: "TikTok", youtube: "YouTube",
};
const SOCIAL_PLACEHOLDERS: Record<SocialKey, string> = {
  instagram: "https://instagram.com/roomeasy", x: "https://x.com/roomeasy", facebook: "https://facebook.com/roomeasy",
  linkedin: "https://linkedin.com/company/roomeasy", tiktok: "https://tiktok.com/@roomeasy", youtube: "https://youtube.com/@roomeasy",
};

export function PlatformSettingsPanel() {
  const { locale } = useLanguage();
  const fr = locale === "fr";
  const L = (pair: [string, string]) => (fr ? pair[0] : pair[1]);

  const [view, setView] = useState<IntegrationViewDto | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [fees, setFees] = useState({ commissionRate: "", serviceFeeRate: "", taxRate: "", weekend: "", longStay: "", lastMinute: "" });
  const queryClient = useQueryClient();
  const emptySocial = Object.fromEntries(SOCIAL_KEYS.map((k) => [k, ""])) as SocialLinksDto;
  const [social, setSocial] = useState<SocialLinksDto>(emptySocial);
  const [testTo, setTestTo] = useState("");
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [feesLoaded, setFeesLoaded] = useState(false);

  useEffect(() => {
    settingsApi.integrations().then((v) => {
      setView(v);
      setDraft(Object.fromEntries(Object.entries(v).map(([k, f]) => [k, f.value])));
    }).catch(() => toast.error(fr ? "Réglages indisponibles." : "Settings unavailable."));
    settingsApi.admin().then((s) => { setSocial({ ...emptySocial, ...(s.socialLinks ?? {}) }); setFees({
      commissionRate: String(s.commissionRate),
      serviceFeeRate: String(+(s.serviceFeeRate * 100).toFixed(2)),
      taxRate: String(+(s.taxRate * 100).toFixed(2)),
      weekend: String(s.rateRules.weekend),
      longStay: String(s.rateRules.longStay),
      lastMinute: String(s.rateRules.lastMinute),
    }); setFeesLoaded(true); }).catch(() => toast.error(fr ? "Impossible de charger les frais actuels." : "Could not load the current fees."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveGroup(fields: Field[], id: string) {
    if (!view) return;
    const patch: Record<string, string> = {};
    for (const f of fields) {
      const value = (draft[f.key] ?? "").trim();
      if (value !== view[f.key]?.value) patch[f.key] = value;
    }
    if (!Object.keys(patch).length) { toast.info(fr ? "Aucun changement." : "Nothing changed."); return; }
    setBusy(id);
    try {
      const v = await settingsApi.saveIntegrations(patch);
      setView(v);
      setDraft((d) => ({ ...d, ...Object.fromEntries(fields.map((f) => [f.key, v[f.key]?.value ?? ""])) }));
      toast.success(fr ? "Réglages enregistrés." : "Settings saved.");
    } catch { toast.error(fr ? "Enregistrement impossible." : "Could not save."); }
    finally { setBusy(null); }
  }

  async function saveFees() {
    setBusy("fees");
    try {
      await settingsApi.saveAdmin({
        commissionRate: Number(fees.commissionRate) || 0,
        serviceFeeRate: (Number(fees.serviceFeeRate) || 0) / 100,
        taxRate: (Number(fees.taxRate) || 0) / 100,
        weekend: Number(fees.weekend) || 0,
        longStay: Number(fees.longStay) || 0,
        lastMinute: Number(fees.lastMinute) || 0,
      });
      toast.success(fr ? "Frais enregistrés." : "Fees saved.");
    } catch { toast.error(fr ? "Enregistrement impossible." : "Could not save."); }
    finally { setBusy(null); }
  }

  async function saveSocial() {
    const cleaned = Object.fromEntries(SOCIAL_KEYS.map((k) => [k, social[k].trim()])) as SocialLinksDto;
    const bad = SOCIAL_KEYS.find((k) => cleaned[k] && !/^https?:\/\/\S+$/i.test(cleaned[k]));
    if (bad) { toast.error(fr ? `Lien ${SOCIAL_LABELS[bad]} invalide : il doit commencer par https://` : `${SOCIAL_LABELS[bad]} link must start with https://`); return; }
    setBusy("social");
    try {
      const saved = await settingsApi.saveAdmin({ socialLinks: cleaned });
      setSocial({ ...emptySocial, ...(saved.socialLinks ?? cleaned) });
      await queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      toast.success(fr ? "Réseaux sociaux enregistrés." : "Social links saved.");
    } catch { toast.error(fr ? "Enregistrement impossible." : "Could not save."); }
    finally { setBusy(null); }
  }

  async function runTest(kind: "email" | "stripe") {
    setBusy(kind);
    try {
      const r = kind === "email" ? await settingsApi.testEmail(testTo) : await settingsApi.testStripe();
      if (r.ok) toast.success(kind === "email" ? (fr ? "Email de test envoyé." : "Test email sent.") : (fr ? "Stripe connecté." : "Stripe connected."));
      else toast.error(r.error ?? "Error");
    } catch { toast.error(fr ? "Test impossible." : "Test failed."); }
    finally { setBusy(null); }
  }

  function renderField(f: Field) {
    const meta = view?.[f.key];
    const id = `cfg-${f.key}`;
    return (
      <div key={f.key} className="space-y-1.5">
        <Label htmlFor={id} className="flex items-center gap-2">
          {L(f.label)}
          {meta?.source === "env" && <Badge variant="outline" className="text-[10px]">{fr ? "fichier serveur" : "server file"}</Badge>}
        </Label>
        {f.type === "select" ? (
          <select id={id} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>
            <option value="">—</option>
            {f.options!.map((o) => <option key={o} value={o}>{o === "true" ? (fr ? "Oui" : "Yes") : (fr ? "Non" : "No")}</option>)}
          </select>
        ) : (
          <div className="flex gap-2">
            <Input id={id} type={f.type === "password" && !shown[f.key] ? "password" : f.type === "number" ? "number" : "text"} autoComplete="off"
              className="font-mono text-sm" placeholder={f.placeholder}
              value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            {f.type === "password" && (
              <Button type="button" variant="outline" size="icon" aria-label={shown[f.key] ? "Hide" : "Show"}
                onClick={() => setShown({ ...shown, [f.key]: !shown[f.key] })}>
                {shown[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            <Button type="button" variant="outline" size="icon" aria-label="Copy" disabled={!draft[f.key]}
              onClick={() => { void navigator.clipboard.writeText(draft[f.key] ?? ""); toast.success(fr ? "Copié." : "Copied."); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const card = "rounded-lg border border-border bg-surface p-6 shadow-sm space-y-4";
  const feeField = (key: keyof typeof fees, label: [string, string]) => (
    <div key={key} className="space-y-1.5">
      <Label htmlFor={`fee-${key}`}>{L(label)}</Label>
      <Input id={`fee-${key}`} type="number" step="0.01" min={0} value={fees[key]} onChange={(e) => setFees({ ...fees, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className={card}>
        <h3 className="flex items-center gap-2 font-semibold"><Mail className="size-4" />{fr ? "Email (SMTP)" : "Email (SMTP)"}</h3>
        <div className="grid gap-4 sm:grid-cols-2">{EMAIL_FIELDS.map(renderField)}</div>
        <Button disabled={busy === "smtp" || !view} onClick={() => saveGroup(EMAIL_FIELDS, "smtp")}>{fr ? "Enregistrer" : "Save"}</Button>
        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="test-to">{fr ? "Envoyer un email de test à" : "Send a test email to"}</Label>
            <Input id="test-to" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          </div>
          <Button variant="outline" disabled={!testTo || busy === "email"} onClick={() => runTest("email")}>{fr ? "Tester l'email" : "Test email"}</Button>
        </div>
      </section>

      <section className={card}>
        <h3 className="flex items-center gap-2 font-semibold"><CreditCard className="size-4" />Stripe</h3>
        <div className="grid gap-4">{STRIPE_FIELDS.map(renderField)}</div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy === "stripe-save" || !view} onClick={() => saveGroup(STRIPE_FIELDS, "stripe-save")}>{fr ? "Enregistrer" : "Save"}</Button>
          <Button variant="outline" disabled={busy === "stripe"} onClick={() => runTest("stripe")}>{fr ? "Tester Stripe" : "Test Stripe"}</Button>
        </div>
      </section>

      <section className={`${card} xl:col-span-2`}>
        <h3 className="flex items-center gap-2 font-semibold"><Percent className="size-4" />{fr ? "Frais et tarification" : "Fees and pricing"}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {feeField("commissionRate", ["Commission plateforme (%)", "Platform commission (%)"])}
          {feeField("serviceFeeRate", ["Frais de service voyageur (%)", "Guest service fee (%)"])}
          {feeField("taxRate", ["Taxe (%)", "Tax (%)"])}
          {feeField("weekend", ["Majoration week-end (%)", "Weekend increase (%)"])}
          {feeField("longStay", ["Remise long séjour (%)", "Long-stay discount (%)"])}
          {feeField("lastMinute", ["Remise dernière minute (%)", "Last-minute discount (%)"])}
        </div>
        <Button disabled={busy === "fees" || !feesLoaded} onClick={saveFees}>{fr ? "Enregistrer les frais" : "Save fees"}</Button>
      </section>

      <section className={`${card} xl:col-span-2`}>
        <h3 className="flex items-center gap-2 font-semibold"><Share2 className="size-4" />{fr ? "Réseaux sociaux" : "Social media"}</h3>
        <p className="text-sm text-muted-foreground">
          {fr ? "Ces liens s'affichent dans le pied de page. Laissez vide pour masquer un réseau." : "These links appear in the site footer. Leave a field empty to hide that network."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIAL_KEYS.map((k) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={`social-${k}`}>{SOCIAL_LABELS[k]}</Label>
              <Input id={`social-${k}`} type="url" inputMode="url" autoComplete="off" placeholder={SOCIAL_PLACEHOLDERS[k]}
                value={social[k]} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <Button disabled={busy === "social" || !feesLoaded} onClick={saveSocial}>{fr ? "Enregistrer les réseaux" : "Save social links"}</Button>
      </section>
    </div>
  );
}
