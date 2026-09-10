/**
 * ChevronDownIcon — dropdown arrow indicator for the LanguageSelector.
 *
 * Extracted from `language-selector.tsx` alongside CheckIcon so both Lucide-
 * style inline SVGs live in dedicated, single-purpose modules.
 */

import { SVG_NAMESPACE } from '@/components/ui/svg-constants'
import { cn } from '@/lib/utils'

interface ChevronDownIconProps {
  className?: string
  'aria-hidden'?: boolean | string
}

export function ChevronDownIcon({
  className,
  'aria-hidden': ariaHidden = true,
}: ChevronDownIconProps) {
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
      className={cn('lucide lucide-chevron-down', className)}
      aria-hidden={ariaHidden}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
