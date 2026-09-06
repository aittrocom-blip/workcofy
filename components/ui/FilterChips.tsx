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
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const active = current[group.param] ?? null
        return (
          <div key={group.param} className="flex items-center gap-3">
            <span className="w-20 flex-none text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group.label}</span>
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
        )
      })}
    </div>
  )
}
