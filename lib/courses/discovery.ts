// Curated entry points for /aprende (redesign brief §6, §8, §13, §14). Every
// entry is a plain link into the existing filter/URL model — no new data.

export interface DiscoveryLink {
  label: string
  href: string
  description?: string
}

// "Explora temas populares" — chips that resolve to real filters, so they
// always return results from the current catalog.
export const POPULAR_TOPICS: DiscoveryLink[] = [
  { label: 'ChatGPT', href: '/aprende?herramienta=chatgpt' },
  { label: 'Claude', href: '/aprende?herramienta=claude' },
  { label: 'Gemini', href: '/aprende?herramienta=gemini' },
  { label: 'Copilot', href: '/aprende?herramienta=copilot' },
  { label: 'Automatización', href: '/aprende?herramienta=automatizacion' },
  { label: 'Marketing con IA', href: '/aprende/ia-para-marketing' },
  { label: 'Diseño', href: '/aprende?area=diseno' },
  { label: 'Productividad', href: '/aprende?herramienta=productividad' },
  { label: 'Datos', href: '/aprende?area=datos' },
]

// Examples under the hero search box.
export const SEARCH_EXAMPLES: DiscoveryLink[] = [
  { label: 'ChatGPT', href: '/aprende?q=ChatGPT' },
  { label: 'Claude', href: '/aprende?q=Claude' },
  { label: 'Marketing con IA', href: '/aprende/ia-para-marketing' },
  { label: 'Automatización', href: '/aprende?herramienta=automatizacion' },
  { label: 'Diseño', href: '/aprende?area=diseno' },
  { label: 'Productividad', href: '/aprende?herramienta=productividad' },
]

// "Convierte el conocimiento en oportunidades" — each route is the existing
// /aprende/ia-para-<area> collection page.
export const LEARNING_PATHS: DiscoveryLink[] = [
  { label: 'IA para Marketing', href: '/aprende/ia-para-marketing', description: 'Contenido, campañas y análisis con IA.' },
  { label: 'IA para Ventas', href: '/aprende/ia-para-ventas', description: 'Prospección, propuestas y seguimiento asistidos.' },
  { label: 'IA para Diseño', href: '/aprende/ia-para-diseno', description: 'Ideación, prototipos y producción visual.' },
  { label: 'IA para Finanzas', href: '/aprende/ia-para-finanzas', description: 'Análisis, reportes y automatización de tareas.' },
  { label: 'IA para Emprendedores', href: '/aprende/ia-para-emprendimiento', description: 'Lanza y opera con menos recursos.' },
  { label: 'IA para Datos', href: '/aprende/ia-para-datos', description: 'De hojas de cálculo a modelos y agentes.' },
]

// "¿No sabes por dónde empezar?" — preset filters.
export const START_OPTIONS: DiscoveryLink[] = [
  { label: 'Soy principiante', href: '/aprende?nivel=principiante', description: 'Fundamentos claros, sin experiencia previa.' },
  { label: 'Quiero aplicar IA a mi trabajo', href: '/aprende/ia-por-profesion', description: 'Cursos por área profesional.' },
  { label: 'Quiero aprender una herramienta', href: '/aprende/herramientas', description: 'ChatGPT, Claude, Gemini, Copilot y más.' },
  { label: 'Quiero certificarme', href: '/aprende/certificaciones', description: 'Certificaciones oficiales reconocidas.' },
]
