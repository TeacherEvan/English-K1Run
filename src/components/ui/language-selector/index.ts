/**
 * LanguageSelector barrel.
 *
 * Re-exports the public component and its icon helpers from the split
 * `language-selector/` directory so consumers can import from a single path
 * (`@/components/ui/language-selector`) without knowing the internal file
 * layout.
 */

export { LanguageSelector, type LanguageSelectorProps } from './language-selector'
export { CheckIcon } from './check-icon'
export { ChevronDownIcon } from './chevron-down-icon'
