export interface AvatarOption {
  id: string
  src: string
  label: string
}

// Real character art the user supplied (media/avatares/*.png in the repo
// root, resized from ~1250px/1-2.8MB sources down to 256×256 and copied
// into public/avatars/ ahead of this plan's execution). explorador-default
// is first on purpose — it's both the picker's first option and, via
// avatarFor's fallback below, the avatar shown before a user has chosen one.
export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'explorador-default', src: '/avatars/explorador-default.png', label: 'Explorador' },
  { id: 'chica', src: '/avatars/chica.png', label: 'Chica' },
  { id: 'chico', src: '/avatars/chico.png', label: 'Chico' },
  { id: 'intelectual', src: '/avatars/intelectual.png', label: 'Intelectual' },
  { id: 'robotico', src: '/avatars/robotico.png', label: 'Robótico' },
  { id: 'espacial', src: '/avatars/espacial.png', label: 'Espacial' },
  { id: 'ai', src: '/avatars/ai.png', label: 'AI' },
]

export function avatarFor(avatarId: string | null): AvatarOption {
  return AVATAR_OPTIONS.find((option) => option.id === avatarId) ?? AVATAR_OPTIONS[0]
}
