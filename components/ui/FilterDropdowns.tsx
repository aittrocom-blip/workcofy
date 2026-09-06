import Link from 'next/link'
import { filterHref } from './filterHref'
import type { ChipGroup } from './FilterChips'
import { CHIP_ACTIVE, CHIP_INACTIVE } from './FilterChips'

interface FilterDropdownsProps {
  basePath: string
  current: Record<string, string>
  groups: ChipGroup[]
  /** Href that clears every filter (kept when there is something to clear). */
  clearHref?: string | null
}

const TRIGGER =
  'flex cursor-pointer list-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors [&::-webkit-details-marker]:hidden'

function Caret() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

function GroupLinks({ basePath, current, group }: { basePath: string; current: Record<string, string>; group: ChipGroup }) {
  const active = current[group.param] ?? null
  return (
    <div className="flex flex-wrap gap-1.5">
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
    </div>
  )
}

// Compact filters with no client JS: each group is a native <details>
// disclosure. Desktop shows one dropdown per group; mobile collapses them
// all into a single "Filtros" panel. Picking an option navigates (the page
// re-renders with the new searchParams), which closes the disclosure.
export function FilterDropdowns({ basePath, current, groups, clearHref = null }: FilterDropdownsProps) {
  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {groups.map((group) => {
          const activeValue = current[group.param] ?? null
          const activeLabel = activeValue ? group.options.find((o) => o.value === activeValue)?.label ?? null : null
          return (
            <details key={group.param} className="relative">
              <summary
                className={`${TRIGGER} ${activeLabel ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-black'}`}
              >
                {group.label}
                {activeLabel && <span className="font-normal opacity-80">· {activeLabel}</span>}
                <Caret />
              </summary>
              <div className="absolute left-0 z-30 mt-2 w-max max-w-[min(90vw,28rem)] rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_16px_36px_rgba(0,0,0,0.12)]">
                <GroupLinks basePath={basePath} current={current} group={group} />
              </div>
            </details>
          )
        })}
        {clearHref && (
          <Link href={clearHref} className="ml-1 text-xs font-semibold text-gray-500 underline-offset-2 hover:text-black hover:underline">
            Limpiar filtros
          </Link>
        )}
      </div>

      <details className="md:hidden">
        <summary className={`${TRIGGER} w-fit border-gray-200 bg-white text-gray-700`}>
          Filtros
          <Caret />
        </summary>
        <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          {groups.map((group) => (
            <div key={group.param}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>
              <GroupLinks basePath={basePath} current={current} group={group} />
            </div>
          ))}
          {clearHref && (
            <Link href={clearHref} className="text-xs font-semibold text-gray-500 underline-offset-2 hover:text-black hover:underline">
              Limpiar filtros
            </Link>
          )}
        </div>
      </details>
    </>
  )
}
