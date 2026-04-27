import fs from 'node:fs'
import path from 'node:path'
import manifest from '../../public/manifest.json'
import { describe, expect, it } from 'vitest'

const publicDir = path.resolve(__dirname, '../../public')
const indexHtml = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8')
const vitePwaConfig = fs.readFileSync(
  path.resolve(__dirname, '../../vite-pwa-config.ts'),
  'utf8',
)

const getAppleTouchIconHref = (): string => {
  const match = indexHtml.match(/<link rel="apple-touch-icon" href="([^"]+)"/)
  if (!match) {
    throw new Error('Expected apple-touch-icon link in index.html')
  }

  return match[1]
}

describe('brand metadata', () => {
  it('uses the public English K1 Run branding', () => {
    expect(manifest.name).toBe('English K1 Run')
    expect(manifest.short_name).toBe('English K1 Run')
  })

  it('describes the classroom launch flow', () => {
    expect(manifest.description).toContain('teacher-launched')
    expect(manifest.description).toContain('child-played')
    expect(manifest.description).toContain('classroom')
  })

  it('references an Apple touch icon that exists in public assets', () => {
    const appleTouchIconHref = getAppleTouchIconHref()
    const appleTouchIconPath = path.join(publicDir, appleTouchIconHref.replace(/^\//, ''))

    expect(fs.existsSync(appleTouchIconPath)).toBe(true)
    expect(vitePwaConfig).toContain(
      `"${appleTouchIconHref.replace(/^\//, '')}"`,
    )
  })
})
