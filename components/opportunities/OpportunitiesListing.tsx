import { listPublishedOpportunities } from '@/lib/data/opportunities'
import {
  EXPERIENCE_LEVELS,
  OPPORTUNITY_COUNTRIES,
  OPPORTUNITY_MODALITIES,
  OPPORTUNITY_TYPES,
  type OpportunityCategory,
} from '@/lib/opportunities/constants'
import {
  hasActiveOpportunityFilters,
  opportunityFiltersToParams,
  parseOpportunityFilters,
  type OpportunityFilters,
  type SearchParamsInput,
} from '@/lib/opportunities/queryBuilder'
import { PROFESSION_OPTIONS } from '@/lib/professions'
import type { ChipGroup } from '@/components/ui/FilterChips'
import { FilterDropdowns } from '@/components/ui/FilterDropdowns'
import { Pagination } from '@/components/ui/Pagination'
import { OpportunityCard } from './OpportunityCard'

interface OpportunitiesListingProps {
  basePath: string
  category: OpportunityCategory | null
  searchParams: SearchParamsInput
  /** Anchor id so hero/category links can scroll here. */
  id?: string
}

const AI_OPTIONS = [
  { value: '1', label: 'Solo IA' },
  { value: '0', label: 'Sin IA' },
]

const SORT_OPTIONS = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'relevant', label: 'Más relevantes' },
] as const

// Results block shared by /oportunidades and /oportunidades/[categoria]:
// count, sort, compact filters, the IA highlight, and the grid. The hero and
// quick categories live in the page components around it (redesign brief).
export async function OpportunitiesListing({ basePath, category, searchParams, id }: OpportunitiesListingProps) {
  const filters = parseOpportunityFilters(searchParams)
  // A category page bakes its own constraint in; the URL params refine within it.
  const fixed: OpportunityFilters = {
    ...(category?.filter.type ? { type: category.filter.type } : {}),
    ...(category?.filter.modality ? { modality: category.filter.modality } : {}),
    ...(category?.filter.ai ? { ai: true } : {}),
  }
  const effective: OpportunityFilters = { ...filters, ...fixed }
  const current = opportunityFiltersToParams(filters)
  const result = await listPublishedOpportunities(effective)
  const now = new Date()

  const groups: ChipGroup[] = []
  if (!category?.filter.type) groups.push({ label: 'Tipo', param: 'tipo', options: OPPORTUNITY_TYPES })
  if (!category?.filter.modality) groups.push({ label: 'Modalidad', param: 'modalidad', options: OPPORTUNITY_MODALITIES })
  if (!category?.filter.ai) groups.push({ label: 'IA', param: 'ia', options: AI_OPTIONS, allLabel: 'Todas' })
  groups.push({ label: 'Nivel', param: 'nivel', options: EXPERIENCE_LEVELS })
  groups.push({ label: 'Área', param: 'area', options: PROFESSION_OPTIONS, allLabel: 'Todas' })
  groups.push({ label: 'País', param: 'pais', options: OPPORTUNITY_COUNTRIES })

  const clearHref = hasActiveOpportunityFilters(filters, fixed) ? basePath : null
  const sortHidden = Object.entries(current).filter(([key]) => key !== 'orden')

  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-8 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium text-gray-700">
          <span className="font-bold text-black">{result.total}</span>{' '}
          {result.total === 1 ? 'oportunidad encontrada' : 'oportunidades encontradas'}
          {filters.q && <span className="text-gray-500"> para “{filters.q}”</span>}
        </p>
        <form action={basePath} method="get" className="flex items-center gap-2">
          {sortHidden.map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>Ordenar por</span>
            <select
              name="orden"
              defaultValue={filters.sort ?? 'recent'}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-black">
            Aplicar
          </button>
        </form>
      </div>

      <div className="mt-4">
        <FilterDropdowns basePath={basePath} current={current} groups={groups} clearHref={clearHref} />
      </div>

      {!category?.filter.ai && (
        <div className="mt-6 rounded-[28px] border border-workcofy-yellow/40 bg-workcofy-yellow/10 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-600">✦ Oportunidades con IA</p>
              <h2 className="mt-2 text-xl font-bold text-black">
                Descubre oportunidades donde la inteligencia artificial ya forma parte del trabajo.
              </h2>
            </div>
            <a
              href="/oportunidades/ia"
              className="inline-flex flex-none items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]"
            >
              Explorar oportunidades IA →
            </a>
          </div>
        </div>
      )}

      {result.items.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm font-semibold">No encontramos oportunidades con estos filtros</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con menos filtros o con otra búsqueda.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} now={now} />
          ))}
        </div>
      )}

      <Pagination basePath={basePath} current={current} page={result.page} total={result.total} pageSize={result.pageSize} />
    </section>
  )
}
