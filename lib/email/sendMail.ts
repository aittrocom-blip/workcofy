import 'server-only'
import nodemailer from 'nodemailer'

// hola@workcofy.com over Hostinger's SMTP relay — same mailbox Supabase Auth
// uses for its own emails, reused here for anything our own app needs to
// send directly (currently just the daily signup digest).
function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  if (!host || !port || !user || !pass) {
    throw new Error('Missing SMTP environment variables (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD)')
  }
  return nodemailer.createTransport({
    host,
    port: Number(port),
    // Port 465 wants implicit TLS; everything else (587) negotiates STARTTLS
    // itself — see the port-465-hangs-with-Supabase issue this same mailbox
    // hit earlier, which is why 587 is the configured value.
    secure: Number(port) === 465,
    auth: { user, pass },
  })
}

export interface SendMailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const transporter = getTransporter()
  const senderName = process.env.SMTP_SENDER_NAME || 'Workcofy'
  await transporter.sendMail({
    from: `"${senderName}" <${process.env.SMTP_USER}>`,
    ...options,
  })
}
