// Curated entry points for /oportunidades (redesign brief §5). Every entry
// is a plain link into the existing filter/URL model — no new data.

export interface DiscoveryLink {
  label: string
  href: string
}

export const SEARCH_EXAMPLES: DiscoveryLink[] = [
  { label: 'Marketing', href: '/oportunidades?area=marketing' },
  { label: 'Diseñador UX', href: '/oportunidades?q=UX' },
  { label: 'Claude', href: '/oportunidades?q=Claude' },
  { label: 'Trabajo remoto', href: '/oportunidades/remoto' },
  { label: 'Data Analyst', href: '/oportunidades?q=Data+Analyst' },
  { label: 'IA', href: '/oportunidades/ia' },
]
