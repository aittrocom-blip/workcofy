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
    return <p className="text-sm text-gray-500">Este espacio todavía no tiene redes sociales registradas.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-black"
        >
          <InstagramIcon />
          Instagram
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
          TikTok
        </a>
      )}
    </div>
  )
}
