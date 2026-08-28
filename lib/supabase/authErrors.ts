import type { AuthError } from '@supabase/supabase-js'

// Supabase's own error message text is English and sometimes too specific
// (e.g. exposes whether an email is already registered) — map known codes to
// generic, Spanish, user-safe copy instead of showing `error.message` raw.
const MESSAGES: Record<string, string> = {
  user_already_exists: 'Ya existe una cuenta con ese correo.',
  email_exists: 'Ya existe una cuenta con ese correo.',
  weak_password: 'La contraseña es muy débil. Usa al menos 6 caracteres.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de ingresar — revisa tu bandeja de entrada.',
  email_address_invalid: 'Ese correo no es válido.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera un momento e intenta de nuevo.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento e intenta de nuevo.',
  otp_expired: 'El link expiró. Pide uno nuevo.',
}

export function translateAuthError(error: AuthError): string {
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
  return 'Ocurrió un error. Intenta de nuevo.'
}

export const NETWORK_ERROR_MESSAGE = 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.'
