// French subjects for notification e-mails (generated from the server templates).
const PAIRS: [string, string][] = [
  ["Confirm your RoomEasy email address", "Confirmez votre adresse e-mail RoomEasy"],
  [
    "Your listing is now live",
    "Votre annonce est en ligne"
  ],
  [
    "Your listing needs changes",
    "Votre annonce nécessite des modifications"
  ],
  [
    "Your listing has been taken offline",
    "Votre annonce a été mise hors ligne"
  ],
  [
    "Your account has been suspended",
    "Votre compte a été suspendu"
  ],
  [
    "Your account is active again",
    "Votre compte est de nouveau actif"
  ],
  [
    "Your RoomEasy account has been closed",
    "Votre compte RoomEasy a été clôturé"
  ],
  [
    "Your identity is verified",
    "Votre identité est vérifiée"
  ],
  [
    "We could not verify your identity",
    "Nous n'avons pas pu vérifier votre identité"
  ],
  [
    "Booking {{reference}} has been cancelled",
    "La réservation {{reference}} a été annulée"
  ],
  [
    "A refund of {{amountUsd}} USD has been issued",
    "Un remboursement de {{amountUsd}} USD a été émis"
  ],
  [
    "Your commission rate has changed",
    "Votre taux de commission a changé"
  ],
  [
    "Reply to your request {{reference}}",
    "Réponse à votre demande {{reference}}"
  ],
  [
    "Your payout account is ready",
    "Votre compte de versement est prêt"
  ],
  [
    "Booking {{reference}} is confirmed",
    "La réservation {{reference}} est confirmée"
  ],
  [
    "We could not process your payment",
    "Nous n'avons pas pu traiter votre paiement"
  ],
  [
    "Your verification code",
    "Votre code de vérification"
  ],
  [
    "Confirm your email address",
    "Confirmez votre adresse e-mail"
  ],
  [
    "Your request for {{stayName}} was sent",
    "Votre demande pour {{stayName}} a été envoyée"
  ],
  [
    "New booking request: {{stayName}}",
    "Nouvelle demande de réservation : {{stayName}}"
  ],
  [
    "Booking {{reference}} is confirmed",
    "La réservation {{reference}} est confirmée"
  ],
  [
    "Booking {{reference}} is confirmed",
    "La réservation {{reference}} est confirmée"
  ],
  [
    "Booking {{reference}} was declined",
    "La réservation {{reference}} a été refusée"
  ],
  [
    "Booking {{reference}} was cancelled by the guest",
    "La réservation {{reference}} a été annulée par le voyageur"
  ],
  [
    "Booking {{reference}} was cancelled by the host",
    "La réservation {{reference}} a été annulée par l'hôte"
  ],
  [
    "Booking {{reference}} was cancelled",
    "La réservation {{reference}} a été annulée"
  ],
  [
    "New message from {{senderName}}",
    "Nouveau message de {{senderName}}"
  ]
];


const ES_PAIRS: [string, string][] = [
  ["Confirm your RoomEasy email address", "Confirma tu dirección de correo de RoomEasy"],
  ["Your listing is now live", "Tu anuncio ya está publicado"],
  ["Your listing needs changes", "Tu anuncio necesita cambios"],
  ["Your listing has been taken offline", "Tu anuncio ha sido retirado"],
  ["Your account has been suspended", "Tu cuenta ha sido suspendida"],
  ["Your account is active again", "Tu cuenta vuelve a estar activa"],
  ["Your RoomEasy account has been closed", "Tu cuenta de RoomEasy ha sido cerrada"],
  ["Your identity is verified", "Tu identidad ha sido verificada"],
  ["We could not verify your identity", "No hemos podido verificar tu identidad"],
  ["Booking {{reference}} has been cancelled", "La reserva {{reference}} ha sido cancelada"],
  ["A refund of {{amountUsd}} USD has been issued", "Se ha emitido un reembolso de {{amountUsd}} USD"],
  ["Your commission rate has changed", "Tu tasa de comisión ha cambiado"],
  ["Reply to your request {{reference}}", "Respuesta a tu solicitud {{reference}}"],
  ["Your payout account is ready", "Tu cuenta de pagos está lista"],
  ["Booking {{reference}} is confirmed", "La reserva {{reference}} está confirmada"],
  ["We could not process your payment", "No hemos podido procesar tu pago"],
  ["Your verification code", "Tu código de verificación"],
  ["Confirm your email address", "Confirma tu dirección de correo"],
  ["Your request for {{stayName}} was sent", "Tu solicitud para {{stayName}} ha sido enviada"],
  ["New booking request: {{stayName}}", "Nueva solicitud de reserva: {{stayName}}"],
  ["Booking {{reference}} was declined", "La reserva {{reference}} fue rechazada"],
  ["Booking {{reference}} was cancelled by the guest", "La reserva {{reference}} fue cancelada por el huésped"],
  ["Booking {{reference}} was cancelled by the host", "La reserva {{reference}} fue cancelada por el anfitrión"],
  ["Booking {{reference}} was cancelled", "La reserva {{reference}} fue cancelada"],
  ["New message from {{senderName}}", "Nuevo mensaje de {{senderName}}"],
];

const DE_PAIRS: [string, string][] = [
  ["Confirm your RoomEasy email address", "Bestätigen Sie Ihre RoomEasy-E-Mail-Adresse"],
  ["Your listing is now live", "Ihr Inserat ist jetzt online"],
  ["Your listing needs changes", "Ihr Inserat benötigt Änderungen"],
  ["Your listing has been taken offline", "Ihr Inserat wurde offline genommen"],
  ["Your account has been suspended", "Ihr Konto wurde gesperrt"],
  ["Your account is active again", "Ihr Konto ist wieder aktiv"],
  ["Your RoomEasy account has been closed", "Ihr RoomEasy-Konto wurde geschlossen"],
  ["Your identity is verified", "Ihre Identität wurde verifiziert"],
  ["We could not verify your identity", "Wir konnten Ihre Identität nicht verifizieren"],
  ["Booking {{reference}} has been cancelled", "Die Buchung {{reference}} wurde storniert"],
  ["A refund of {{amountUsd}} USD has been issued", "Eine Rückerstattung von {{amountUsd}} USD wurde veranlasst"],
  ["Your commission rate has changed", "Ihr Provisionssatz hat sich geändert"],
  ["Reply to your request {{reference}}", "Antwort auf Ihre Anfrage {{reference}}"],
  ["Your payout account is ready", "Ihr Auszahlungskonto ist bereit"],
  ["Booking {{reference}} is confirmed", "Die Buchung {{reference}} ist bestätigt"],
  ["We could not process your payment", "Wir konnten Ihre Zahlung nicht verarbeiten"],
  ["Your verification code", "Ihr Bestätigungscode"],
  ["Confirm your email address", "Bestätigen Sie Ihre E-Mail-Adresse"],
  ["Your request for {{stayName}} was sent", "Ihre Anfrage für {{stayName}} wurde gesendet"],
  ["New booking request: {{stayName}}", "Neue Buchungsanfrage: {{stayName}}"],
  ["Booking {{reference}} was declined", "Die Buchung {{reference}} wurde abgelehnt"],
  ["Booking {{reference}} was cancelled by the guest", "Die Buchung {{reference}} wurde vom Gast storniert"],
  ["Booking {{reference}} was cancelled by the host", "Die Buchung {{reference}} wurde vom Gastgeber storniert"],
  ["Booking {{reference}} was cancelled", "Die Buchung {{reference}} wurde storniert"],
  ["New message from {{senderName}}", "Neue Nachricht von {{senderName}}"],
];

const PT_PAIRS: [string, string][] = [
  ["Confirm your RoomEasy email address", "Confirme o seu endereço de e-mail da RoomEasy"],
  ["Your listing is now live", "O seu anúncio já está publicado"],
  ["Your listing needs changes", "O seu anúncio precisa de alterações"],
  ["Your listing has been taken offline", "O seu anúncio foi retirado"],
  ["Your account has been suspended", "A sua conta foi suspensa"],
  ["Your account is active again", "A sua conta está novamente ativa"],
  ["Your RoomEasy account has been closed", "A sua conta RoomEasy foi encerrada"],
  ["Your identity is verified", "A sua identidade foi verificada"],
  ["We could not verify your identity", "Não foi possível verificar a sua identidade"],
  ["Booking {{reference}} has been cancelled", "A reserva {{reference}} foi cancelada"],
  ["A refund of {{amountUsd}} USD has been issued", "Foi emitido um reembolso de {{amountUsd}} USD"],
  ["Your commission rate has changed", "A sua taxa de comissão foi alterada"],
  ["Reply to your request {{reference}}", "Resposta ao seu pedido {{reference}}"],
  ["Your payout account is ready", "A sua conta de pagamentos está pronta"],
  ["Booking {{reference}} is confirmed", "A reserva {{reference}} está confirmada"],
  ["We could not process your payment", "Não foi possível processar o seu pagamento"],
  ["Your verification code", "O seu código de verificação"],
  ["Confirm your email address", "Confirme o seu endereço de e-mail"],
  ["Your request for {{stayName}} was sent", "O seu pedido para {{stayName}} foi enviado"],
  ["New booking request: {{stayName}}", "Novo pedido de reserva: {{stayName}}"],
  ["Booking {{reference}} was declined", "A reserva {{reference}} foi recusada"],
  ["Booking {{reference}} was cancelled by the guest", "A reserva {{reference}} foi cancelada pelo hóspede"],
  ["Booking {{reference}} was cancelled by the host", "A reserva {{reference}} foi cancelada pelo anfitrião"],
  ["Booking {{reference}} was cancelled", "A reserva {{reference}} foi cancelada"],
  ["New message from {{senderName}}", "Nova mensagem de {{senderName}}"],
];

function buildPatterns(pairs: [string, string][]) {
  return pairs.map(([en, fr]) => {
  const names: string[] = [];
  const src = en.split(/(\{\{\w+\}\})/).map((part) => {
    const m = /^\{\{(\w+)\}\}$/.exec(part);
    if (m) { names.push(m[1] ?? ""); return "(.+?)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
    return { re: new RegExp(`^${src}$`), names, fr };
  });
}

const PATTERNS = buildPatterns(PAIRS);
const ES_PATTERNS = buildPatterns(ES_PAIRS);
const DE_PATTERNS = buildPatterns(DE_PAIRS);
const PT_PATTERNS = buildPatterns(PT_PAIRS);

function translateWith(patterns: ReturnType<typeof buildPatterns>, subject: string): string {
  for (const p of patterns) {
    const m = p.re.exec(subject);
    if (m) return p.names.reduce((out, name, i) => out.split(`{{${name}}}`).join(m[i + 1] ?? ""), p.fr);
  }
  return subject;
}

export function frenchSubject(subject: string): string {
  return translateWith(PATTERNS, subject);
}

/** Translate a notification e-mail subject into the given locale (falls back to English). */
export function localizedSubject(locale: string, subject: string): string {
  switch (locale) {
    case "fr":
      return translateWith(PATTERNS, subject);
    case "es":
      return translateWith(ES_PATTERNS, subject);
    case "de":
      return translateWith(DE_PATTERNS, subject);
    case "pt":
      return translateWith(PT_PATTERNS, subject);
    default:
      return subject;
  }
}
