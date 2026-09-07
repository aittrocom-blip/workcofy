import { describe, expect, it } from 'vitest'
import { toSafeJsonLdString } from './jsonLdScript'

describe('toSafeJsonLdString', () => {
  it('produces valid JSON that round-trips', () => {
    const data = { title: 'Analista', tags: ['a', 'b'] }
    expect(JSON.parse(toSafeJsonLdString(data).replace(/\\u003c/g, '<'))).toEqual(data)
  })

  it('escapes </script> so it cannot terminate the surrounding tag', () => {
    const data = { description: 'Texto</script><script>alert(1)</script>' }
    const serialized = toSafeJsonLdString(data)
    // Only `<` needs escaping — a bare `>` can't open or close a tag on its
    // own, so `</script` no longer parses as a closing tag once its `<` is gone.
    expect(serialized).not.toContain('</script')
    expect(serialized).toContain('\\u003c/script>')
  })
})
