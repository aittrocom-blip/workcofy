import type { GetOnBoardJob } from './getonboard'

const BASE_URL = 'https://www.getonbrd.com/api/v0'
const EXPAND = encodeURIComponent('["company","modality","seniority","tags"]')

export async function fetchGetOnBoardCategoryPage(
  categoryId: string,
  page: number
): Promise<{ jobs: GetOnBoardJob[]; totalPages: number }> {
  const url = `${BASE_URL}/categories/${categoryId}/jobs?per_page=100&page=${page}&expand=${EXPAND}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Workcofy/1.0 (+https://workcofy.com)' },
  })
  if (!response.ok) throw new Error(`GetOnBoard ${categoryId} page ${page}: HTTP ${response.status}`)
  const body = (await response.json()) as { data?: GetOnBoardJob[]; meta?: { total_pages?: number } }
  return { jobs: body.data ?? [], totalPages: body.meta?.total_pages ?? 1 }
}
