// Serializes a JSON-LD payload for embedding inside a
// <script type="application/ld+json"> tag. Escaping every `<` neutralizes a
// `</script>` sequence that could appear inside an untrusted text field
// (e.g. a scraped job description) and terminate the tag early — the
// standard technique for safely inlining JSON inside HTML.
export function toSafeJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
