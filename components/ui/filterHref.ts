export function filterHref(
  basePath: string,
  current: Record<string, string>,
  param: string,
  value: string | null
): string {
  const params = new URLSearchParams(current)
  params.delete('page')
  if (value === null) params.delete(param)
  else params.set(param, value)
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}
