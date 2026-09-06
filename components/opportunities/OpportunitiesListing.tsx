import { listPublishedOpportunities } from '@/lib/data/opportunities'
import {
  EXPERIENCE_LEVELS,
  OPPORTUNITY_CATEGORY_SLUGS,
  OPPORTUNITY_COUNTRIES,
  OPPORTUNITY_MODALITIES,
  OPPORTUNITY_TYPES,
  type OpportunityCategory,
} from '@/lib/opportunities/constants'
import {
  opportunityFiltersToParams,
  parseOpportunityFilters,
  type OpportunityFilters,
  type SearchParamsInput,
} from '@/lib/opportunities/queryBuilder'
import { PROFESSION_OPTIONS } from '@/lib/professions'
import { CategoryTabs } from '@/components/ui/CategoryTabs'
import { FilterChips, type ChipGroup } from '@/components/ui/FilterChips'
import { Pagination } from '@/components/ui/Pagination'
import { SearchForm } from '@/components/ui/SearchForm'
import { OpportunityCard } from './OpportunityCard'

interface OpportunitiesListingProps {
  basePath: string
  category: OpportunityCategory | null
  searchParams: SearchParamsInput
}

const AI_OPTIONS = [
  { value: '1', label: 'Solo IA' },
  { value: '0', label: 'Sin IA' },
]

export async function OpportunitiesListing({ basePath, category, searchParams }: OpportunitiesListingProps) {
  const filters = parseOpportunityFilters(searchParams)
  // A category page bakes its own constraint in; the URL params refine within it.
  const effective: OpportunityFilters = {
    ...filters,
    ...(category?.filter.type ? { type: category.filter.type } : {}),
    ...(category?.filter.modality ? { modality: category.filter.modality } : {}),
    ...(category?.filter.ai ? { ai: true } : {}),
  }
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

  const tabs = [
    { href: '/oportunidades', label: 'Todas' },
    ...OPPORTUNITY_CATEGORY_SLUGS.map((entry) => ({ href: `/oportunidades/${entry.slug}`, label: entry.label })),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <header className="rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-[#f7f7f5] to-[#eef2f6] p-5 shadow-[0_16px_38px_rgba(0,0,0,0.04)] md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">Workcofy</span>
            <span>Descubre</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-[-0.04em] text-black md:text-5xl">
              {category ? category.title : 'Encuentra tu próxima oportunidad.'}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-600 md:text-lg">
              {category
                ? category.description
                : 'Trabajo remoto, freelance, proyectos y prácticas de Perú, Latinoamérica y el mundo.'}
            </p>
          </div>

          <div className="max-w-4xl">
            <SearchForm basePath={basePath} current={current} placeholder="Buscar por puesto, habilidad o empresa..." />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
              {result.total} {result.total === 1 ? 'oportunidad encontrada' : 'oportunidades encontradas'}
            </div>
            <span className="text-sm text-gray-500">La postulación se hace en el sitio original</span>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <CategoryTabs items={tabs} activeHref={basePath} />
      </div>

      <div className="mt-5 rounded-[24px] border border-gray-200 bg-white p-3 shadow-sm md:p-4">
        {/* Filters stack as full-width rows; the sort control gets its own
            row below instead of sitting beside a six-row-tall chip stack. */}
        <div className="flex flex-col gap-3">
          <FilterChips basePath={basePath} current={current} groups={groups} />
          <div className="flex items-center justify-end gap-3">
            <form action={basePath} method="get" className="flex items-center gap-2">
              {Object.entries(current)
                .filter(([key]) => key !== 'orden' && key !== 'page')
                .map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <span>Ordenar por</span>
                <select
                  name="orden"
                  defaultValue={filters.sort ?? 'recent'}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:border-black"
                >
                  <option value="recent">Más recientes</option>
                  <option value="relevant">Más relevantes</option>
                </select>
              </label>
              <button type="submit" className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                Aplicar
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-workcofy-yellow/40 bg-workcofy-yellow/10 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-600">✦ Oportunidades con IA</p>
            <h2 className="mt-2 text-xl font-bold text-black">Descubre oportunidades donde la inteligencia artificial ya forma parte del trabajo.</h2>
          </div>
          <a
            href={`${basePath}?ia=1`}
            className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]"
          >
            Explorar oportunidades IA →
          </a>
        </div>
      </div>

      {result.items.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm font-semibold">No encontramos oportunidades con estos filtros</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con menos filtros o con otra búsqueda.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} now={now} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Pagination basePath={basePath} current={current} page={result.page} total={result.total} pageSize={result.pageSize} />
      </div>
    </div>
  )
}
