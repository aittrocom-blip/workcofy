interface SocialLinksProps {
  instagramUrl: string | null
  tiktokUrl: string | null
}

// Hand-drawn to match the app's own inline-SVG icon style rather than a
// specific brand's official logo artwork.
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 3v10.5a3.5 3.5 0 11-3-3.46" strokeLinecap="round" />
      <path d="M14 3a5 5 0 005 5" strokeLinecap="round" />
    </svg>
  )
}

export function SocialLinks({ instagramUrl, tiktokUrl }: SocialLinksProps) {
  if (!instagramUrl && !tiktokUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">Próximamente: videos de este espacio</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Estamos verificando sus cuentas para mostrar contenido útil para trabajar, reunirse y organizar eventos.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm leading-5 text-gray-600">
        Mira cómo se vive este espacio antes de visitarlo: trabajo, reuniones y eventos.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-black"
        >
          <InstagramIcon />
          Instagram del local
        </a>
      )}
      {tiktokUrl && (
        <a
          href={tiktokUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-black"
        >
          <TikTokIcon />
          TikTok del local
        </a>
      )}
      </div>
    </div>
  )
}
