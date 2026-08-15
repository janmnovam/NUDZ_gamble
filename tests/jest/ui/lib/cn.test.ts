import { cn } from '@ui/lib/cn.ts'

describe('cn', () => {
  it('joins truthy class names with a single space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('drops false, null and undefined so conditional classes vanish', () => {
    expect(cn('base', false, null, undefined, 'end')).toBe('base end')
  })
})
