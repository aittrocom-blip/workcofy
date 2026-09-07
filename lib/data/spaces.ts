import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { buildSpaceQueryDescriptor, type SpaceFilters } from '@/lib/data/spaceQueryBuilder'
import type { SpaceRecord } from '@/lib/data/spaceTypes'
import { parseAmenities } from '@/lib/amenities/types'
import { generateSpaceSlug } from '@/lib/slug'
import type { OpeningHours } from '@/lib/hours/openingHours'

export type { SpaceFilters }

function normalizeSpace(row: Record<string, unknown>): SpaceRecord {
  return { ...row, amenities: parseAmenities(row.amenities) } as SpaceRecord
}

export async function listSpaces(filters: SpaceFilters = {}): Promise<SpaceRecord[]> {
  const supabase = createServerSupabaseClient()
  const descriptor = buildSpaceQueryDescriptor(filters)

  let query = supabase.from('spaces').select('*').eq('active', true)
  for (const filter of descriptor.eqFilters) {
    query = query.eq(filter.column, filter.value)
  }
  if (descriptor.categoryIn) {
    query = query.in('category', descriptor.categoryIn)
  }
  if (descriptor.searchTerm) {
    // Sanitize search term to prevent PostgREST filter injection by removing reserved characters
    const sanitizedSearch = descriptor.searchTerm.replace(/[,()."*\\]/g, ' ')
    const term = `%${sanitizedSearch}%`
    query = query.or(`name.ilike.${term},address.ilike.${term}`)
  }

  const { data, error } = await query.order('name', { ascending: true })
  if (error) throw new Error(`Failed to list spaces: ${error.message}`)
  return (data ?? []).map(normalizeSpace)
}

export async function getSpacesByIds(ids: string[]): Promise<SpaceRecord[]> {
  if (ids.length === 0) return []
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('spaces').select('*').in('id', ids).eq('active', true)
  if (error) throw new Error(`Failed to load spaces by id: ${error.message}`)
  return (data ?? []).map(normalizeSpace)
}

export async function getSpaceBySlug(slug: string): Promise<SpaceRecord | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (error) throw new Error(`Failed to load space "${slug}": ${error.message}`)
  return data ? normalizeSpace(data) : null
}

// Admin-only reads: unlike every function above, these must also surface
// deactivated (active = false) spaces — otherwise a deactivated space would
// vanish from the admin list and its own edit page (404), making
// "Reactivar" impossible to reach. Service role, bypasses RLS/the active filter.
export async function listAllSpacesForAdmin(): Promise<SpaceRecord[]> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('spaces').select('*').order('name', { ascending: true })
  if (error) throw new Error(`Failed to list spaces: ${error.message}`)
  return (data ?? []).map(normalizeSpace)
}

export async function getSpaceBySlugForAdmin(slug: string): Promise<SpaceRecord | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase.from('spaces').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(`Failed to load space "${slug}": ${error.message}`)
  return data ? normalizeSpace(data) : null
}

// The anon key can only read `spaces` (RLS grants no write policy), so
// incrementing the page-view counter goes through the admin client instead —
// the space detail page calls this itself; never exposed to the browser.
export async function incrementViewCount(id: string, currentCount: number): Promise<void> {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase
    .from('spaces')
    .update({ view_count: currentCount + 1 })
    .eq('id', id)
  if (error) {
    console.warn(`Failed to increment view_count for space ${id}: ${error.message}`)
  }
}

export interface CreateSpaceInput {
  name: string
  category: string
  district: string
  country: string
  address?: string | null
  // Optional — filled in when the admin picked a Google Places match instead
  // of entering everything by hand (see app/admin/espacios/nuevo/actions.ts).
  latitude?: number | null
  longitude?: number | null
  googlePlaceId?: string | null
  googleMapsUrl?: string | null
  phone?: string | null
  website?: string | null
  rating?: number | null
  reviewCount?: number | null
  priceLevel?: number | null
  openingHours?: OpeningHours | null
  dataSource?: 'mock' | 'google'
}

const MAX_SLUG_ATTEMPTS = 5

// Shared by the admin "Agregar espacio" form and approving a community
// suggestion — both just need name/category/district/country/address; every
// other field (photos, hours, phone...) is filled in afterwards on the
// existing per-space edit page. Everything else (active, verified,
// partner_status, data_source) is left to its table default.
export async function createSpace(input: CreateSpaceInput): Promise<{ id: string; slug: string }> {
  const admin = createAdminSupabaseClient()
  const baseSlug = generateSpaceSlug(input.name, input.district)

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
    const { data, error } = await admin
      .from('spaces')
      .insert({
        name: input.name,
        slug,
        category: input.category,
        district: input.district,
        country: input.country,
        address: input.address || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        google_place_id: input.googlePlaceId ?? null,
        google_maps_url: input.googleMapsUrl ?? null,
        phone: input.phone ?? null,
        website: input.website ?? null,
        rating: input.rating ?? null,
        review_count: input.reviewCount ?? null,
        price_level: input.priceLevel ?? null,
        opening_hours: input.openingHours ?? null,
        data_source: input.dataSource ?? 'mock',
      })
      .select('id, slug')
      .single()

    if (!error) return data
    if (error.code !== '23505') throw new Error(`No se pudo crear el espacio: ${error.message}`)
    // 23505 = unique_violation. If it's google_place_id, this exact Google
    // listing is already in Workcofy — a new slug won't fix that. If the
    // existing row was soft-deleted (active=false), reactivate it with the
    // freshly submitted fields instead of dead-ending: "delete, then add the
    // same place again" should just bring it back, not block forever.
    if (error.message.includes('google_place_id') && input.googlePlaceId) {
      return reviveDeactivatedSpace(admin, input)
    }
    // Otherwise it's the slug — retry with a numbered suffix.
  }

  throw new Error('No se pudo generar un slug único para este espacio — prueba con otro nombre.')
}

// Reuses the existing row (and its slug — never rewritten here, to avoid
// breaking anything already pointing at it) instead of creating a second
// one for the same Google Place. Only reachable for a soft-deleted match;
// createSpace() throws its own error first if the match is still active.
async function reviveDeactivatedSpace(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  input: CreateSpaceInput
): Promise<{ id: string; slug: string }> {
  const { data: existing, error: findError } = await admin
    .from('spaces')
    .select('id, active')
    .eq('google_place_id', input.googlePlaceId)
    .single()

  if (findError || !existing) throw new Error('Ya existe un espacio con este mismo lugar de Google Maps.')
  if (existing.active) throw new Error('Ya existe un espacio activo con este mismo lugar de Google Maps.')

  const { data, error } = await admin
    .from('spaces')
    .update({
      active: true,
      name: input.name,
      category: input.category,
      district: input.district,
      country: input.country,
      address: input.address || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      google_maps_url: input.googleMapsUrl ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      rating: input.rating ?? null,
      review_count: input.reviewCount ?? null,
      price_level: input.priceLevel ?? null,
      opening_hours: input.openingHours ?? null,
      data_source: input.dataSource ?? 'mock',
    })
    .eq('id', existing.id)
    .select('id, slug')
    .single()

  if (error || !data) throw new Error(`No se pudo reactivar el espacio: ${error?.message ?? 'error desconocido'}`)
  return data
}
