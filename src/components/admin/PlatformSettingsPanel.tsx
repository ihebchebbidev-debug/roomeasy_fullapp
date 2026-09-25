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

const SETTINGS_COPY = {
  es: { "Settings unavailable.": "Ajustes no disponibles.", "Could not load the current fees.": "No se pudieron cargar las tarifas actuales.", "Nothing changed.": "No hay cambios.", "Settings saved.": "Ajustes guardados.", "Could not save.": "No se pudo guardar.", "Fees saved.": "Tarifas guardadas.", "Social links saved.": "Enlaces sociales guardados.", "Test email sent.": "Correo de prueba enviado.", "Stripe connected.": "Stripe conectado.", "Test failed.": "La prueba falló.", "server file": "archivo del servidor", Yes: "Sí", No: "No", Hide: "Ocultar", Show: "Mostrar", Copy: "Copiar", Copied: "Copiado.", Save: "Guardar", "Send a test email to": "Enviar un correo de prueba a", "Test email": "Probar correo", "Test Stripe": "Probar Stripe", "Fees and pricing": "Tarifas y precios", "Save fees": "Guardar tarifas", "Social media": "Redes sociales", "These links appear in the site footer. Leave a field empty to hide that network.": "Estos enlaces aparecen en el pie de página. Deja un campo vacío para ocultar esa red.", "Save social links": "Guardar redes sociales", "SMTP server": "Servidor SMTP", Port: "Puerto", "Secure connection (SSL)": "Conexión segura (SSL)", Username: "Usuario", Password: "Contraseña", "Sender address": "Dirección de envío", "Sender name": "Nombre del remitente", "Reply-to address": "Dirección de respuesta", "Test mode (sends nothing)": "Modo de prueba (no envía nada)", "Publishable key": "Clave pública", "Secret key": "Clave secreta", "Webhook secret": "Secreto del webhook", "Stripe Connect country": "País de Stripe Connect", "Platform commission (%)": "Comisión de la plataforma (%)", "Guest service fee (%)": "Tarifa de servicio al huésped (%)", "Tax (%)": "Impuesto (%)", "Weekend increase (%)": "Aumento de fin de semana (%)", "Long-stay discount (%)": "Descuento por estancia larga (%)", "Last-minute discount (%)": "Descuento de última hora (%)" },
  de: { "Settings unavailable.": "Einstellungen nicht verfügbar.", "Could not load the current fees.": "Die aktuellen Gebühren konnten nicht geladen werden.", "Nothing changed.": "Keine Änderungen.", "Settings saved.": "Einstellungen gespeichert.", "Could not save.": "Speichern nicht möglich.", "Fees saved.": "Gebühren gespeichert.", "Social links saved.": "Social-Media-Links gespeichert.", "Test email sent.": "Test-E-Mail gesendet.", "Stripe connected.": "Stripe verbunden.", "Test failed.": "Test fehlgeschlagen.", "server file": "Serverdatei", Yes: "Ja", No: "Nein", Hide: "Ausblenden", Show: "Anzeigen", Copy: "Kopieren", Copied: "Kopiert.", Save: "Speichern", "Send a test email to": "Test-E-Mail senden an", "Test email": "E-Mail testen", "Test Stripe": "Stripe testen", "Fees and pricing": "Gebühren und Preise", "Save fees": "Gebühren speichern", "Social media": "Soziale Medien", "These links appear in the site footer. Leave a field empty to hide that network.": "Diese Links erscheinen in der Fußzeile. Lassen Sie ein Feld leer, um das Netzwerk auszublenden.", "Save social links": "Social-Media-Links speichern", "SMTP server": "SMTP-Server", Port: "Port", "Secure connection (SSL)": "Sichere Verbindung (SSL)", Username: "Benutzername", Password: "Passwort", "Sender address": "Absenderadresse", "Sender name": "Absendername", "Reply-to address": "Antwortadresse", "Test mode (sends nothing)": "Testmodus (sendet nichts)", "Publishable key": "Öffentlicher Schlüssel", "Secret key": "Geheimer Schlüssel", "Webhook secret": "Webhook-Geheimnis", "Stripe Connect country": "Stripe-Connect-Land", "Platform commission (%)": "Plattformprovision (%)", "Guest service fee (%)": "Servicegebühr für Gäste (%)", "Tax (%)": "Steuer (%)", "Weekend increase (%)": "Wochenendaufschlag (%)", "Long-stay discount (%)": "Langzeitrabatt (%)", "Last-minute discount (%)": "Last-Minute-Rabatt (%)" },
  pt: { "Settings unavailable.": "Definições indisponíveis.", "Could not load the current fees.": "Não foi possível carregar as taxas atuais.", "Nothing changed.": "Sem alterações.", "Settings saved.": "Definições guardadas.", "Could not save.": "Não foi possível guardar.", "Fees saved.": "Taxas guardadas.", "Social links saved.": "Ligações sociais guardadas.", "Test email sent.": "E-mail de teste enviado.", "Stripe connected.": "Stripe ligado.", "Test failed.": "O teste falhou.", "server file": "ficheiro do servidor", Yes: "Sim", No: "Não", Hide: "Ocultar", Show: "Mostrar", Copy: "Copiar", Copied: "Copiado.", Save: "Guardar", "Send a test email to": "Enviar um e-mail de teste para", "Test email": "Testar e-mail", "Test Stripe": "Testar Stripe", "Fees and pricing": "Taxas e preços", "Save fees": "Guardar taxas", "Social media": "Redes sociais", "These links appear in the site footer. Leave a field empty to hide that network.": "Estas ligações aparecem no rodapé. Deixe um campo vazio para ocultar essa rede.", "Save social links": "Guardar redes sociais", "SMTP server": "Servidor SMTP", Port: "Porta", "Secure connection (SSL)": "Ligação segura (SSL)", Username: "Utilizador", Password: "Palavra-passe", "Sender address": "Endereço de envio", "Sender name": "Nome do remetente", "Reply-to address": "Endereço de resposta", "Test mode (sends nothing)": "Modo de teste (não envia nada)", "Publishable key": "Chave pública", "Secret key": "Chave secreta", "Webhook secret": "Segredo do webhook", "Stripe Connect country": "País do Stripe Connect", "Platform commission (%)": "Comissão da plataforma (%)", "Guest service fee (%)": "Taxa de serviço do hóspede (%)", "Tax (%)": "Imposto (%)", "Weekend increase (%)": "Aumento de fim de semana (%)", "Long-stay discount (%)": "Desconto de longa duração (%)", "Last-minute discount (%)": "Desconto de última hora (%)" },
} as const;

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
  const T = (english: string, french = english) => fr ? french : (SETTINGS_COPY[locale as keyof typeof SETTINGS_COPY] as Record<string, string> | undefined)?.[english] ?? english;
  const L = (pair: [string, string]) => T(pair[1], pair[0]);

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
    }).catch(() => toast.error(T("Settings unavailable.", "Réglages indisponibles.")));
    settingsApi.admin().then((s) => { setSocial({ ...emptySocial, ...(s.socialLinks ?? {}) }); setFees({
      commissionRate: String(s.commissionRate),
      serviceFeeRate: String(+(s.serviceFeeRate * 100).toFixed(2)),
      taxRate: String(+(s.taxRate * 100).toFixed(2)),
      weekend: String(s.rateRules.weekend),
      longStay: String(s.rateRules.longStay),
      lastMinute: String(s.rateRules.lastMinute),
    }); setFeesLoaded(true); }).catch(() => toast.error(T("Could not load the current fees.", "Impossible de charger les frais actuels.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveGroup(fields: Field[], id: string) {
    if (!view) return;
    const patch: Record<string, string> = {};
    for (const f of fields) {
      const value = (draft[f.key] ?? "").trim();
      if (value !== view[f.key]?.value) patch[f.key] = value;
    }
    if (!Object.keys(patch).length) { toast.info(T("Nothing changed.", "Aucun changement.")); return; }
    setBusy(id);
    try {
      const v = await settingsApi.saveIntegrations(patch);
      setView(v);
      setDraft((d) => ({ ...d, ...Object.fromEntries(fields.map((f) => [f.key, v[f.key]?.value ?? ""])) }));
      toast.success(T("Settings saved.", "Réglages enregistrés."));
    } catch { toast.error(T("Could not save.", "Enregistrement impossible.")); }
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
      toast.success(T("Fees saved.", "Frais enregistrés."));
    } catch { toast.error(T("Could not save.", "Enregistrement impossible.")); }
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
      toast.success(T("Social links saved.", "Réseaux sociaux enregistrés."));
    } catch { toast.error(T("Could not save.", "Enregistrement impossible.")); }
    finally { setBusy(null); }
  }

  async function runTest(kind: "email" | "stripe") {
    setBusy(kind);
    try {
      const r = kind === "email" ? await settingsApi.testEmail(testTo) : await settingsApi.testStripe();
      if (r.ok) toast.success(kind === "email" ? T("Test email sent.", "Email de test envoyé.") : T("Stripe connected.", "Stripe connecté."));
      else toast.error(r.error ?? "Error");
    } catch { toast.error(T("Test failed.", "Test impossible.")); }
    finally { setBusy(null); }
  }

  function renderField(f: Field) {
    const meta = view?.[f.key];
    const id = `cfg-${f.key}`;
    return (
      <div key={f.key} className="space-y-1.5">
        <Label htmlFor={id} className="flex items-center gap-2">
          {L(f.label)}
          {meta?.source === "env" && <Badge variant="outline" className="text-[10px]">{T("server file", "fichier serveur")}</Badge>}
        </Label>
        {f.type === "select" ? (
          <select id={id} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>
            <option value="">—</option>
            {f.options!.map((o) => <option key={o} value={o}>{o === "true" ? T("Yes", "Oui") : T("No", "Non")}</option>)}
          </select>
        ) : (
          <div className="flex gap-2">
            <Input id={id} type={f.type === "password" && !shown[f.key] ? "password" : f.type === "number" ? "number" : "text"} autoComplete="off"
              className="font-mono text-sm" placeholder={f.placeholder}
              value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            {f.type === "password" && (
              <Button type="button" variant="outline" size="icon" aria-label={shown[f.key] ? T("Hide", "Masquer") : T("Show", "Afficher")}
                onClick={() => setShown({ ...shown, [f.key]: !shown[f.key] })}>
                {shown[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            <Button type="button" variant="outline" size="icon" aria-label={T("Copy", "Copier")} disabled={!draft[f.key]}
              onClick={() => { void navigator.clipboard.writeText(draft[f.key] ?? ""); toast.success(T("Copied.", "Copié.")); }}>
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
        <Button disabled={busy === "smtp" || !view} onClick={() => saveGroup(EMAIL_FIELDS, "smtp")}>{T("Save", "Enregistrer")}</Button>
        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="test-to">{T("Send a test email to", "Envoyer un e-mail de test à")}</Label>
            <Input id="test-to" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          </div>
          <Button variant="outline" disabled={!testTo || busy === "email"} onClick={() => runTest("email")}>{T("Test email", "Tester l'e-mail")}</Button>
        </div>
      </section>

      <section className={card}>
        <h3 className="flex items-center gap-2 font-semibold"><CreditCard className="size-4" />Stripe</h3>
        <div className="grid gap-4">{STRIPE_FIELDS.map(renderField)}</div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy === "stripe-save" || !view} onClick={() => saveGroup(STRIPE_FIELDS, "stripe-save")}>{T("Save", "Enregistrer")}</Button>
          <Button variant="outline" disabled={busy === "stripe"} onClick={() => runTest("stripe")}>{T("Test Stripe", "Tester Stripe")}</Button>
        </div>
      </section>

      <section className={`${card} xl:col-span-2`}>
        <h3 className="flex items-center gap-2 font-semibold"><Percent className="size-4" />{T("Fees and pricing", "Frais et tarification")}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {feeField("commissionRate", ["Commission plateforme (%)", "Platform commission (%)"])}
          {feeField("serviceFeeRate", ["Frais de service voyageur (%)", "Guest service fee (%)"])}
          {feeField("taxRate", ["Taxe (%)", "Tax (%)"])}
          {feeField("weekend", ["Majoration week-end (%)", "Weekend increase (%)"])}
          {feeField("longStay", ["Remise long séjour (%)", "Long-stay discount (%)"])}
          {feeField("lastMinute", ["Remise dernière minute (%)", "Last-minute discount (%)"])}
        </div>
        <Button disabled={busy === "fees" || !feesLoaded} onClick={saveFees}>{T("Save fees", "Enregistrer les frais")}</Button>
      </section>

      <section className={`${card} xl:col-span-2`}>
        <h3 className="flex items-center gap-2 font-semibold"><Share2 className="size-4" />{T("Social media", "Réseaux sociaux")}</h3>
        <p className="text-sm text-muted-foreground">
          {T("These links appear in the site footer. Leave a field empty to hide that network.", "Ces liens s'affichent dans le pied de page. Laissez vide pour masquer un réseau.")}
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
        <Button disabled={busy === "social" || !feesLoaded} onClick={saveSocial}>{T("Save social links", "Enregistrer les réseaux")}</Button>
      </section>
    </div>
  );
}
