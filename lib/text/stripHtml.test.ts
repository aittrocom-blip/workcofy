import { describe, expect, it } from 'vitest'
import { stripHtml } from './stripHtml'

describe('stripHtml', () => {
  it('turns block tags into line breaks and bullets, decodes entities, collapses blank lines', () => {
    const html = '<div>• Ventas SaaS<br>• CRM &amp; HubSpot</div><p>Extra&nbsp;line</p><ul><li>uno</li><li>dos</li></ul>'
    expect(stripHtml(html)).toBe('• Ventas SaaS\n• CRM & HubSpot\nExtra line\n• uno\n• dos')
  })
  it('handles empty and tag-free input', () => {
    expect(stripHtml('')).toBe('')
    expect(stripHtml('  plano  ')).toBe('plano')
  })
})
