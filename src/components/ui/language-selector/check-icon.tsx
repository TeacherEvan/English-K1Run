/**
 * CheckIcon — selected-option indicator for the LanguageSelector dropdown.
 *
 * Extracted from `language-selector.tsx` so the inline SVG definition is a
 * single, shareable, localizable point (was previously a duplicated literal
 * inline in the component file).
 */

import { SVG_NAMESPACE } from '@/components/ui/svg-constants'
import { cn } from '@/lib/utils'

interface CheckIconProps {
  className?: string
}

export function CheckIcon({ className }: CheckIconProps) {
  return (
    <svg
      xmlns={SVG_NAMESPACE}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('lucide lucide-check', className)}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
