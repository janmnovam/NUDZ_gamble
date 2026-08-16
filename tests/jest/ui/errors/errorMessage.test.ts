import type { ErrorEnvelope } from '@/app/result.ts'
import { cs } from '@ui/i18n/locales/cs.ts'
import { errorMessageKey } from '@ui/errors/errorMessage.ts'

function envelope(code: string, type: ErrorEnvelope['type'] = 'validation'): ErrorEnvelope {
  return { code, type, trace: 'somewhere (file.ts:1:1)' }
}

describe('errorMessageKey', () => {
  it('names the rule that was broken when the code is known', () => {
    expect(errorMessageKey(envelope('ONBOARDING_TIME_CAP'))).toBe('error.onboarding.timeCap')
    expect(errorMessageKey(envelope('ONBOARDING_STAKES_CAP'))).toBe('error.onboarding.stakesCap')
    expect(errorMessageKey(envelope('DASHBOARD_NO_LIMIT', 'not_found'))).toBe(
      'error.dashboard.noLimit',
    )
  })

  it('falls back to the category for a code it has never seen', () => {
    expect(errorMessageKey(envelope('SOMETHING_NEW', 'conflict'))).toBe('error.type.conflict')
    expect(errorMessageKey(envelope('SOMETHING_NEW', 'not_found'))).toBe('error.type.notFound')
  })

  it('handles a missing envelope rather than rendering nothing', () => {
    expect(errorMessageKey(null)).toBe('error.type.internal')
    expect(errorMessageKey(undefined)).toBe('error.type.internal')
  })

  it('always resolves to a real translation key', () => {
    const codes = [
      'ONBOARDING_NO_COPING',
      'ONBOARDING_TIME_CAP',
      'ONBOARDING_STAKES_CAP',
      'REVIEW_TIME_CAP',
      'REVIEW_STAKES_CAP',
      'REVIEW_NO_PROFILE',
      'DASHBOARD_NO_PROFILE',
      'DASHBOARD_NO_LIMIT',
      'COPING_EMPTY_LABEL',
      'UNKNOWN_CODE',
    ]
    for (const code of codes) {
      expect(cs[errorMessageKey(envelope(code))]).toBeDefined()
    }
  })

  it('never leaks the machine code or the trace into the message', () => {
    const key = errorMessageKey(envelope('ONBOARDING_TIME_CAP'))
    expect(cs[key]).not.toContain('ONBOARDING_TIME_CAP')
    expect(cs[key]).not.toContain('file.ts')
  })
})
