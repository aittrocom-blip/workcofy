// Guards every place a stored URL (e.g. a space's tiktok_url/instagram_url,
// settable by a Partner account — see app/partner/actions.ts) ends up in an
// <a href>. Without this, a `javascript:`/`data:` value saved through that
// form would run in any visitor's session the moment they clicked the link.
export function isSafeExternalUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
