'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import { COUNTRY_OPTIONS } from '@/lib/countries'
import { formatPriceLevel } from '@/lib/priceLevel'
import {
  createSpaceAction,
  getGooglePlaceDetails,
  searchGooglePlaces,
  type GooglePlaceCandidate,
  type GooglePlaceFields,
} from './actions'

// Minimal fields only — just enough to satisfy the spaces table's NOT NULL
// columns. Everything else (photos, horario, teléfono, amenities...) gets
// filled in right after, on the existing per-space edit page this redirects
// to on success.
export function NewSpaceForm() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0].value)
  const [country, setCountry] = useState<string>(COUNTRY_OPTIONS[0].value)
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Google Places search-as-you-type on the name field — picking a result
  // fills the address in immediately and remembers the place id so the
  // server action can fetch the rest (phone, rating, horario...) on submit.
  const [suggestions, setSuggestions] = useState<GooglePlaceCandidate[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [placeDetails, setPlaceDetails] = useState<GooglePlaceFields | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const searchToken = useRef(0)

  useEffect(() => {
    const query = name.trim()
    if (selectedPlaceId || query.length < 3) {
      setSuggestions([])
      setSearchError(null)
      return
    }
    const token = ++searchToken.current
    const timeout = setTimeout(async () => {
      try {
        const results = await searchGooglePlaces(query)
        // Ignore a stale response from a search that's no longer the latest.
        if (token === searchToken.current) {
          setSuggestions(results)
          setSearchError(null)
        }
      } catch (err) {
        if (token === searchToken.current) {
          setSuggestions([])
          setSearchError(err instanceof Error ? err.message : 'No se pudo buscar en Google Maps.')
        }
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [name, selectedPlaceId])

  async function pickSuggestion(candidate: GooglePlaceCandidate) {
    setName(candidate.name)
    if (candidate.address) setAddress(candidate.address)
    setSelectedPlaceId(candidate.placeId)
    setSuggestions([])
    setShowSuggestions(false)

    setPlaceDetails(null)
    setDetailsError(null)
    setLoadingDetails(true)
    try {
      const details = await getGooglePlaceDetails(candidate.placeId)
      setPlaceDetails(details)
      if (details.address) setAddress(details.address)
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'No se pudo cargar la info de Google Maps.')
    } finally {
      setLoadingDetails(false)
    }
  }

  function clearGoogleMatch() {
    setSelectedPlaceId(null)
    setPlaceDetails(null)
    setDetailsError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createSpaceAction({
        name,
        category,
        country,
        district,
        address,
        googlePlaceId: selectedPlaceId,
        googlePlaceDetails: placeDetails,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el espacio.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-md flex-col gap-4">
      <label className="relative flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Nombre *</span>
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setSelectedPlaceId(null)
            setPlaceDetails(null)
            setDetailsError(null)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          required
          autoComplete="off"
          placeholder="Ej: Neira Café Lab"
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 top-full z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white py-1 shadow-[0_16px_36px_rgba(0,0,0,0.12)]">
            {suggestions.map((candidate) => (
              <li key={candidate.placeId}>
                <button
                  type="button"
                  // onMouseDown (not onClick) fires before the input's onBlur closes this list.
                  onMouseDown={() => pickSuggestion(candidate)}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium">{candidate.name}</span>
                  {candidate.address && <span className="block text-xs text-gray-500">{candidate.address}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchError && <span className="text-xs font-medium text-red-600">{searchError}</span>}
      </label>

      {selectedPlaceId && (
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-green-800">✓ Vinculado a Google Maps</span>
            <button
              type="button"
              onClick={clearGoogleMatch}
              className="text-xs font-semibold text-green-700 underline-offset-2 hover:underline"
            >
              Quitar
            </button>
          </div>
          {loadingDetails && <p className="mt-1.5 text-xs text-green-700">Cargando información...</p>}
          {detailsError && <p className="mt-1.5 text-xs text-red-600">{detailsError}</p>}
          {placeDetails && !loadingDetails && (
            <dl className="mt-2 flex flex-col gap-1 text-xs text-green-800">
              {placeDetails.phone && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Teléfono:</dt>
                  <dd>{placeDetails.phone}</dd>
                </div>
              )}
              {placeDetails.website && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Sitio web:</dt>
                  <dd className="truncate">{placeDetails.website}</dd>
                </div>
              )}
              {placeDetails.rating != null && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Rating:</dt>
                  <dd>
                    ★ {placeDetails.rating.toFixed(1)}
                    {placeDetails.reviewCount != null && ` (${placeDetails.reviewCount} reseñas)`}
                  </dd>
                </div>
              )}
              {placeDetails.priceLevel != null && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Precio:</dt>
                  <dd>{formatPriceLevel(placeDetails.priceLevel)}</dd>
                </div>
              )}
              {placeDetails.photoRefs.length > 0 && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Fotos:</dt>
                  <dd>{placeDetails.photoRefs.length} disponibles (se descargan al crear)</dd>
                </div>
              )}
              {placeDetails.openingHours && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Horario:</dt>
                  <dd>Disponible</dd>
                </div>
              )}
            </dl>
          )}
          <p className="mt-2 text-xs text-green-700">Esta información se guardará junto con el espacio.</p>
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Categoría *</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">País *</span>
        <select
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        >
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.flag} {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Zona / distrito *</span>
        <input
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          required
          placeholder="Ej: miraflores, providencia..."
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold">Dirección</span>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Opcional"
          className="rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-black"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-fit rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-50"
      >
        {saving ? 'Creando...' : 'Crear espacio'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
