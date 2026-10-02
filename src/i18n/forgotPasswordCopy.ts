import { useLanguage } from "@/i18n/LanguageProvider";
import { accountFlowCopy } from "@/i18n/accountFlowCopy";
import type { Locale } from "@/i18n/translations";

const copy = {
  en: { description: "Get a 4-digit verification code to reset your RoomEasy password.", newCode: "A new code is on its way.", invalidCode: "Enter the 4-digit code from your email.", emailHint: "Enter your email and we will send you a 4-digit verification code.", send: "Send code", codeTitle: "Enter your code", codePrefix: "We sent a 4-digit code to", codeSuffix: "It expires in 15 minutes.", digit: "Digit", verify: "Verify code", changeEmail: "Change email", resend: "Resend code" },
  fr: { description: "Recevez un code à 4 chiffres pour réinitialiser votre mot de passe RoomEasy.", newCode: "Un nouveau code est en route.", invalidCode: "Saisissez le code à 4 chiffres reçu par e-mail.", emailHint: "Saisissez votre adresse e-mail pour recevoir un code de vérification à 4 chiffres.", send: "Envoyer le code", codeTitle: "Saisissez votre code", codePrefix: "Nous avons envoyé un code à 4 chiffres à", codeSuffix: "Il expire dans 15 minutes.", digit: "Chiffre", verify: "Vérifier le code", changeEmail: "Changer d'adresse e-mail", resend: "Renvoyer le code" },
  es: { description: "Recibe un código de 4 dígitos para restablecer tu contraseña de RoomEasy.", newCode: "Te hemos enviado un nuevo código.", invalidCode: "Introduce el código de 4 dígitos de tu correo.", emailHint: "Introduce tu correo electrónico y te enviaremos un código de verificación de 4 dígitos.", send: "Enviar código", codeTitle: "Introduce tu código", codePrefix: "Hemos enviado un código de 4 dígitos a", codeSuffix: "Caduca en 15 minutos.", digit: "Dígito", verify: "Verificar código", changeEmail: "Cambiar correo", resend: "Reenviar código" },
  de: { description: "Erhalten Sie einen 4-stelligen Code, um Ihr RoomEasy-Passwort zurückzusetzen.", newCode: "Ein neuer Code ist unterwegs.", invalidCode: "Geben Sie den 4-stelligen Code aus Ihrer E-Mail ein.", emailHint: "Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen 4-stelligen Bestätigungscode.", send: "Code senden", codeTitle: "Code eingeben", codePrefix: "Wir haben einen 4-stelligen Code gesendet an", codeSuffix: "Er läuft in 15 Minuten ab.", digit: "Ziffer", verify: "Code bestätigen", changeEmail: "E-Mail ändern", resend: "Code erneut senden" },
  pt: { description: "Receba um código de 4 dígitos para repor a sua palavra-passe RoomEasy.", newCode: "Um novo código está a caminho.", invalidCode: "Introduza o código de 4 dígitos enviado por e-mail.", emailHint: "Introduza o seu e-mail e enviaremos um código de verificação de 4 dígitos.", send: "Enviar código", codeTitle: "Introduza o seu código", codePrefix: "Enviámos um código de 4 dígitos para", codeSuffix: "Expira dentro de 15 minutos.", digit: "Dígito", verify: "Verificar código", changeEmail: "Alterar e-mail", resend: "Reenviar código" },
} satisfies Record<Locale, Record<string, string>>;

export function forgotPasswordCopy(locale: Locale) {
  return { ...copy[locale], title: accountFlowCopy[locale].resetTitle };
}

export function useForgotPasswordCopy() {
  const { locale } = useLanguage();
  return forgotPasswordCopy(locale);
}