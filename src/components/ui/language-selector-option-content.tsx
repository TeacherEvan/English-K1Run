interface LanguageSelectorOptionContentProps {
  label: string
  nativeLabel: string
}

export function LanguageSelectorOptionContent({
  label,
  nativeLabel,
}: LanguageSelectorOptionContentProps) {
  return (
    <div className="language-selector-option-copy flex flex-col gap-0.5">
      <span className="language-selector-option-title font-medium">{label}</span>
      <span className="language-selector-option-native text-xs text-muted-foreground">
        {nativeLabel}
      </span>
    </div>
  )
}
