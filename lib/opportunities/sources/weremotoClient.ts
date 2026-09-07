const BASE_URL = 'https://www.weremoto.com'
const USER_AGENT = 'Workcofy/1.0 (+https://workcofy.com)'
// Fetching 30 detail pages back-to-back would hammer a site with no API
// meant for this — a small delay between requests is the polite default.
const DELAY_BETWEEN_REQUESTS_MS = 300

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWeRemotoListingPage(): Promise<string> {
  const response = await fetch(BASE_URL, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`WeRemoto listing page: HTTP ${response.status}`)
  return response.text()
}

export async function fetchWeRemotoJobPage(slug: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/job-posts/${slug}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`WeRemoto job page "${slug}": HTTP ${response.status}`)
  return response.text()
}

export async function fetchWeRemotoJobPages(slugs: string[]): Promise<Map<string, string>> {
  const pages = new Map<string, string>()
  for (const slug of slugs) {
    try {
      pages.set(slug, await fetchWeRemotoJobPage(slug))
    } catch (error) {
      console.warn(`Failed to fetch WeRemoto job "${slug}":`, error instanceof Error ? error.message : error)
    }
    await sleep(DELAY_BETWEEN_REQUESTS_MS)
  }
  return pages
}

export function weRemotoJobUrl(slug: string): string {
  return `${BASE_URL}/job-posts/${slug}`
}
