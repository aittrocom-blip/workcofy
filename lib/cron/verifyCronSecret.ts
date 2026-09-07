// Vercel sends `Authorization: Bearer <CRON_SECRET>` on requests it makes to
// scheduled cron routes (see vercel.json) when CRON_SECRET is set in the
// project's environment variables. Fails closed: a missing/misconfigured
// secret is treated the same as a bad one — never "allow by default".
export function verifyCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}
