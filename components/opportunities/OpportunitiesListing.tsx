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
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{category ? category.title : 'Oportunidades'}</h1>
      <p className="mt-2 max-w-2xl text-gray-500">
        {category
          ? category.description
          : 'Trabajos remotos, freelance, proyectos y prácticas para Perú, LatAm y el mundo. La postulación se hace en el sitio original.'}
      </p>

      <div className="mt-6">
        <CategoryTabs items={tabs} activeHref={basePath} />
      </div>
      <div className="mt-4 max-w-xl">
        <SearchForm basePath={basePath} current={current} placeholder="Buscar por puesto o empresa..." />
      </div>
      <div className="mt-4">
        <FilterChips basePath={basePath} current={current} groups={groups} />
      </div>

      <p className="mt-6 text-xs text-gray-400">
        {result.total} {result.total === 1 ? 'oportunidad' : 'oportunidades'}
      </p>

      {result.items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold">No encontramos oportunidades con estos filtros</p>
          <p className="mt-1 text-sm text-gray-500">Prueba con menos filtros o con otra búsqueda.</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} now={now} />
          ))}
        </div>
      )}

      <Pagination basePath={basePath} current={current} page={result.page} total={result.total} pageSize={result.pageSize} />
    </div>
  )
}
