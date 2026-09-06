// Minimal HTML → plain text for job descriptions we ingest (GetOnBoard sends
// HTML fragments). Not a sanitizer for rendering HTML — output is always
// rendered as text.
export function stripHtml(html: string): string {
  return html
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/ul|\/ol|\/tr)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '')
    .join('\n')
    .trim()
}
