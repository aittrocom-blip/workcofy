'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBox() {
  const [value, setValue] = useState('')
  const router = useRouter()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const query = value.trim()
    router.push(query ? `/?q=${encodeURIComponent(query)}` : '/')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-black/10"
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="¿Dónde quieres trabajar?"
        aria-label="¿Dónde quieres trabajar?"
        className="flex-1 px-5 py-3 text-sm outline-none"
      />
      <button
        type="submit"
        className="bg-black px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
      >
        Buscar
      </button>
    </form>
  )
}
