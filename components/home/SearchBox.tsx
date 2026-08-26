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
    <form onSubmit={handleSubmit} className="flex overflow-hidden rounded-full border border-gray-300">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="¿Dónde quieres trabajar?"
        className="flex-1 px-4 py-2 text-sm outline-none"
      />
      <button type="submit" className="bg-black px-5 py-2 text-sm font-medium text-white">
        Buscar
      </button>
    </form>
  )
}
