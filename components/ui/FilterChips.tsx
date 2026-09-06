import Link from 'next/link'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { filterHref } from './filterHref'

export interface ChipGroup {
  label: string
  param: string
  options: readonly { value: string; label: string }[]
  allLabel?: string
}

interface FilterChipsProps {
  basePath: string
  current: Record<string, string>
  groups: ChipGroup[]
}

export const CHIP_ACTIVE = 'whitespace-nowrap rounded-full bg-black px-3.5 py-1.5 text-xs font-semibold text-white'
export const CHIP_INACTIVE =
  'whitespace-nowrap rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-black'

// One row of link-chips per filter group. Active chip = param present in
// the URL; clicking "Todos" removes the param. No client state: the page is
// re-rendered by the server with the new searchParams.
export function FilterChips({ basePath, current, groups }: FilterChipsProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      {groups.map((group) => {
        const active = current[group.param] ?? null
        return (
          // Each group is a full-width row: the label stays fixed and the
          // chips scroll horizontally inside `min-w-0 flex-1`, so long groups
          // (Área, País, Idioma) never push the page wider than the viewport.
          <div key={group.param} className="flex w-full min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
            <span className="w-20 flex-none px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">{group.label}</span>
            <div className="min-w-0 flex-1">
              <HorizontalScroller className="gap-1.5">
                <Link href={filterHref(basePath, current, group.param, null)} className={active === null ? CHIP_ACTIVE : CHIP_INACTIVE}>
                  {group.allLabel ?? 'Todos'}
                </Link>
                {group.options.map((option) => (
                  <Link
                    key={option.value}
                    href={filterHref(basePath, current, group.param, option.value)}
                    className={active === option.value ? CHIP_ACTIVE : CHIP_INACTIVE}
                  >
                    {option.label}
                  </Link>
                ))}
              </HorizontalScroller>
            </div>
          </div>
        )
      })}
    </div>
  )
}
