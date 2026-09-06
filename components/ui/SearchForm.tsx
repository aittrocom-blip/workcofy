interface SearchFormProps {
  basePath: string
  current: Record<string, string>
  placeholder: string
}

// Plain GET form: keeps every other filter as hidden inputs so searching
// doesn't drop them, and resets pagination.
export function SearchForm({ basePath, current, placeholder }: SearchFormProps) {
  const hidden = Object.entries(current).filter(([key]) => key !== 'q' && key !== 'page')
  return (
    <form action={basePath} method="get" className="flex w-full items-center gap-2 rounded-[28px] border border-gray-200 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      {hidden.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ''}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border-0 bg-transparent px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.97]"
      >
        Buscar
      </button>
    </form>
  )
}
