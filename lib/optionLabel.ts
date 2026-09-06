export interface LabeledOption {
  readonly value: string
  readonly label: string
}

export function optionLabel(options: readonly LabeledOption[], value: string | null | undefined): string | null {
  if (!value) return null
  return options.find((option) => option.value === value)?.label ?? null
}
