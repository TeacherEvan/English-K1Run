import manifest from '../../public/manifest.json'
import { describe, expect, it } from 'vitest'

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
})
