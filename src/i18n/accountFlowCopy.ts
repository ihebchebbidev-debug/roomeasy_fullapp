import type { Locale } from "@/i18n/translations";

const en = {
  securityCheck: "Please complete the security check first.",
  securityFailed: "Security check failed. Please try again.",
  otpPrompt: "Enter the 6-digit code from your authenticator app.",
  otpLabel: "Two-step code",
  otpHint: "Open your authenticator app and type the current code.",
  accountUnavailable: "The account service is unavailable. Please try again later.",
  imageFailed: "The image could not be prepared.",
  photoFailed: "The profile photo could not be saved.",
  enableTwoFactor: "Turn on two-step sign-in",
  disableTwoFactor: "Turn off two-step sign-in",
  enableHint: "Add RoomEasy to an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code it shows.",
  disableHint: "Enter the current 6-digit code from your authenticator app to confirm.",
  openAuthenticator: "Open in my authenticator app",
  manualKey: "Or add an account manually with this key:",
  sixDigitCode: "6-digit code",
  confirm: "Confirm",
  resetTitle: "Set a new password",
  resetDescription: "Choose a new password for your account.",
  resetInvalid: "This reset link is invalid or has expired.",
  resetInvalidHint: "This reset link is invalid or has expired. Request a new one.",
  resetShort: "Use at least 8 characters.",
  resetMismatch: "The two passwords do not match.",
  resetSuccess: "Your password has been changed.",
  confirmPassword: "Confirm password",
  changePassword: "Change password",
  gateLaunch: "Launching in 2026",
  gateEarly: "Early access",
  gateTitle: "Something new is coming.",
  gateBody: "A new way to book carefully selected stays: clear prices, verified hosts, and support at every step. Opening soon.",
  gateCode: "Have an access code?",
  gatePassword: "Password",
  gateUnlock: "Unlock the site",
  gateEnter: "Enter",
  gateInvalid: "That password is not valid.",
  gateTagline: "Selected stays & hotels",
};

export const accountFlowCopy: Record<Locale, typeof en> = {
  en,
  fr: {
    securityCheck: "Veuillez d'abord effectuer la vérification de sécurité.", securityFailed: "La vérification de sécurité a échoué. Réessayez.", otpPrompt: "Saisissez le code à 6 chiffres de votre application d'authentification.", otpLabel: "Code de vérification en deux étapes", otpHint: "Ouvrez votre application d'authentification et saisissez le code actuel.", accountUnavailable: "Le service de connexion est indisponible. Réessayez plus tard.", imageFailed: "La photo n'a pas pu être préparée.", photoFailed: "La photo de profil n'a pas pu être enregistrée.", enableTwoFactor: "Activer la connexion en deux étapes", disableTwoFactor: "Désactiver la connexion en deux étapes", enableHint: "Ajoutez RoomEasy à une application d'authentification (Google Authenticator, 1Password, Authy), puis saisissez le code à 6 chiffres affiché.", disableHint: "Saisissez le code actuel à 6 chiffres de votre application d'authentification pour confirmer.", openAuthenticator: "Ouvrir dans mon application d'authentification", manualKey: "Ou ajoutez un compte manuellement avec cette clé :", sixDigitCode: "Code à 6 chiffres", confirm: "Confirmer", resetTitle: "Définir un nouveau mot de passe", resetDescription: "Choisissez un nouveau mot de passe pour votre compte.", resetInvalid: "Ce lien de réinitialisation est invalide ou a expiré.", resetInvalidHint: "Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.", resetShort: "Utilisez au moins 8 caractères.", resetMismatch: "Les deux mots de passe ne correspondent pas.", resetSuccess: "Votre mot de passe a été modifié.", confirmPassword: "Confirmer le mot de passe", changePassword: "Modifier le mot de passe", gateLaunch: "Lancement en 2026", gateEarly: "Accès anticipé", gateTitle: "Quelque chose se prépare.", gateBody: "Une nouvelle façon de réserver des séjours choisis un par un : prix clairs, hôtes vérifiés, accompagnement à chaque étape. Ouverture très bientôt.", gateCode: "Vous avez un code d'accès", gatePassword: "Mot de passe", gateUnlock: "Déverrouiller le site", gateEnter: "Entrer", gateInvalid: "Ce mot de passe n'est pas valide.", gateTagline: "Séjours et hôtels sélectionnés",
  },
  es: {
    securityCheck: "Completa primero la verificación de seguridad.", securityFailed: "La verificación de seguridad falló. Inténtalo de nuevo.", otpPrompt: "Introduce el código de 6 dígitos de tu aplicación de autenticación.", otpLabel: "Código de verificación en dos pasos", otpHint: "Abre tu aplicación de autenticación e introduce el código actual.", accountUnavailable: "El servicio de cuentas no está disponible. Inténtalo más tarde.", imageFailed: "No se pudo preparar la imagen.", photoFailed: "No se pudo guardar la foto de perfil.", enableTwoFactor: "Activar la verificación en dos pasos", disableTwoFactor: "Desactivar la verificación en dos pasos", enableHint: "Añade RoomEasy a una aplicación de autenticación (Google Authenticator, 1Password, Authy) e introduce el código de 6 dígitos que muestra.", disableHint: "Introduce el código actual de 6 dígitos de tu aplicación de autenticación para confirmar.", openAuthenticator: "Abrir en mi aplicación de autenticación", manualKey: "O añade una cuenta manualmente con esta clave:", sixDigitCode: "Código de 6 dígitos", confirm: "Confirmar", resetTitle: "Establecer una nueva contraseña", resetDescription: "Elige una nueva contraseña para tu cuenta.", resetInvalid: "Este enlace no es válido o ha caducado.", resetInvalidHint: "Este enlace no es válido o ha caducado. Solicita uno nuevo.", resetShort: "Utiliza al menos 8 caracteres.", resetMismatch: "Las contraseñas no coinciden.", resetSuccess: "Tu contraseña se ha cambiado.", confirmPassword: "Confirmar contraseña", changePassword: "Cambiar contraseña", gateLaunch: "Lanzamiento en 2026", gateEarly: "Acceso anticipado", gateTitle: "Algo nuevo está por llegar.", gateBody: "Una nueva forma de reservar alojamientos seleccionados: precios claros, anfitriones verificados y ayuda en cada paso. Muy pronto.", gateCode: "¿Tienes un código de acceso?", gatePassword: "Contraseña", gateUnlock: "Desbloquear el sitio", gateEnter: "Entrar", gateInvalid: "La contraseña no es válida.", gateTagline: "Alojamientos y hoteles seleccionados",
  },
  de: {
    securityCheck: "Bitte schließen Sie zuerst die Sicherheitsprüfung ab.", securityFailed: "Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.", otpPrompt: "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.", otpLabel: "Zwei-Faktor-Code", otpHint: "Öffnen Sie Ihre Authenticator-App und geben Sie den aktuellen Code ein.", accountUnavailable: "Der Kontodienst ist nicht erreichbar. Bitte versuchen Sie es später erneut.", imageFailed: "Das Bild konnte nicht vorbereitet werden.", photoFailed: "Das Profilfoto konnte nicht gespeichert werden.", enableTwoFactor: "Zwei-Faktor-Anmeldung aktivieren", disableTwoFactor: "Zwei-Faktor-Anmeldung deaktivieren", enableHint: "Fügen Sie RoomEasy einer Authenticator-App hinzu (Google Authenticator, 1Password, Authy) und geben Sie den angezeigten 6-stelligen Code ein.", disableHint: "Geben Sie zur Bestätigung den aktuellen 6-stelligen Code aus Ihrer Authenticator-App ein.", openAuthenticator: "In meiner Authenticator-App öffnen", manualKey: "Oder fügen Sie das Konto manuell mit diesem Schlüssel hinzu:", sixDigitCode: "6-stelliger Code", confirm: "Bestätigen", resetTitle: "Neues Passwort festlegen", resetDescription: "Wählen Sie ein neues Passwort für Ihr Konto.", resetInvalid: "Dieser Link ist ungültig oder abgelaufen.", resetInvalidHint: "Dieser Link ist ungültig oder abgelaufen. Fordern Sie einen neuen an.", resetShort: "Verwenden Sie mindestens 8 Zeichen.", resetMismatch: "Die Passwörter stimmen nicht überein.", resetSuccess: "Ihr Passwort wurde geändert.", confirmPassword: "Passwort bestätigen", changePassword: "Passwort ändern", gateLaunch: "Start 2026", gateEarly: "Frühzeitiger Zugang", gateTitle: "Etwas Neues kommt.", gateBody: "Eine neue Art, ausgewählte Unterkünfte zu buchen: klare Preise, verifizierte Gastgeber und Unterstützung bei jedem Schritt. Bald verfügbar.", gateCode: "Haben Sie einen Zugangscode?", gatePassword: "Passwort", gateUnlock: "Website freischalten", gateEnter: "Weiter", gateInvalid: "Dieses Passwort ist ungültig.", gateTagline: "Ausgewählte Unterkünfte und Hotels",
  },
  pt: {
    securityCheck: "Conclua primeiro a verificação de segurança.", securityFailed: "A verificação de segurança falhou. Tente novamente.", otpPrompt: "Introduza o código de 6 dígitos da sua aplicação de autenticação.", otpLabel: "Código de verificação em dois passos", otpHint: "Abra a sua aplicação de autenticação e introduza o código atual.", accountUnavailable: "O serviço de contas não está disponível. Tente novamente mais tarde.", imageFailed: "Não foi possível preparar a imagem.", photoFailed: "Não foi possível guardar a foto de perfil.", enableTwoFactor: "Ativar a autenticação em dois passos", disableTwoFactor: "Desativar a autenticação em dois passos", enableHint: "Adicione a RoomEasy a uma aplicação de autenticação (Google Authenticator, 1Password, Authy) e introduza o código de 6 dígitos apresentado.", disableHint: "Introduza o código atual de 6 dígitos da sua aplicação de autenticação para confirmar.", openAuthenticator: "Abrir na minha aplicação de autenticação", manualKey: "Ou adicione uma conta manualmente com esta chave:", sixDigitCode: "Código de 6 dígitos", confirm: "Confirmar", resetTitle: "Definir uma nova palavra-passe", resetDescription: "Escolha uma nova palavra-passe para a sua conta.", resetInvalid: "Esta ligação é inválida ou expirou.", resetInvalidHint: "Esta ligação é inválida ou expirou. Peça uma nova.", resetShort: "Utilize pelo menos 8 caracteres.", resetMismatch: "As palavras-passe não coincidem.", resetSuccess: "A sua palavra-passe foi alterada.", confirmPassword: "Confirmar palavra-passe", changePassword: "Alterar palavra-passe", gateLaunch: "Lançamento em 2026", gateEarly: "Acesso antecipado", gateTitle: "Algo novo está a chegar.", gateBody: "Uma nova forma de reservar estadias selecionadas: preços claros, anfitriões verificados e apoio em cada passo. Brevemente.", gateCode: "Tem um código de acesso?", gatePassword: "Palavra-passe", gateUnlock: "Desbloquear o site", gateEnter: "Entrar", gateInvalid: "Esta palavra-passe não é válida.", gateTagline: "Estadias e hotéis selecionados",
  },
};