import { describe, expect, it } from 'vitest'
import { objectKeyFor } from '../../server/utils/s3'

describe('objectKeyFor', () => {
  it('builds a key under the entry date with a safe extension', () => {
    expect(objectKeyFor('2026-09-11', 'IMG_001.JPG', new Date(1757570000000), 'ab12cd'))
      .toBe('entries/2026-09-11/1757570000000-ab12cd.jpg')
  })

  it('falls back to misc and strips unsafe extension characters', () => {
    expect(objectKeyFor(null, 'weird.name.p*n?g', new Date(1), 'x'))
      .toBe('misc/1-x.png')
    expect(objectKeyFor(null, 'noext', new Date(1), 'x'))
      .toBe('misc/1-x.bin')
  })
})
