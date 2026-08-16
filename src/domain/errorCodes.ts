/**
 * Central registry of domain error codes, grouped by domain. Every `DomainError`
 * throw site references one of these constants instead of a bare string literal,
 * so the whole set is discoverable in one place, `DomainError`'s `code` param is
 * type-checked against it, and the UI's code→message map (`errorMessage.ts`) and
 * the tests key off the same source of truth.
 */
export const ERROR_CODES = {
  onboarding: {
    NO_COPING: 'ONBOARDING_NO_COPING',
    TIME_CAP: 'ONBOARDING_TIME_CAP',
    STAKES_CAP: 'ONBOARDING_STAKES_CAP',
  },
  review: {
    NO_PROFILE: 'REVIEW_NO_PROFILE',
    TIME_CAP: 'REVIEW_TIME_CAP',
    STAKES_CAP: 'REVIEW_STAKES_CAP',
  },
  dashboard: {
    NO_PROFILE: 'DASHBOARD_NO_PROFILE',
    NO_LIMIT: 'DASHBOARD_NO_LIMIT',
  },
  checkin: {
    NO_PROFILE: 'CHECKIN_NO_PROFILE',
    NOTHING_TO_EDIT: 'CHECKIN_NOTHING_TO_EDIT',
    OUTSIDE_WINDOW: 'CHECKIN_OUTSIDE_WINDOW',
    WEEK_CLOSED: 'CHECKIN_WEEK_CLOSED',
  },
  coping: {
    EMPTY_LABEL: 'COPING_EMPTY_LABEL',
    EMPTY_ID: 'COPING_EMPTY_ID',
    LABEL_TOO_LONG: 'COPING_LABEL_TOO_LONG',
    DETAIL_TOO_LONG: 'COPING_DETAIL_TOO_LONG',
    NOT_EDITABLE: 'COPING_NOT_EDITABLE',
    NOT_DELETABLE: 'COPING_NOT_DELETABLE',
  },
} as const

type ErrorCodeRegistry = typeof ERROR_CODES

/** Union of every registered code string, e.g. `'CHECKIN_OUTSIDE_WINDOW'`. */
export type DomainErrorCode = {
  [D in keyof ErrorCodeRegistry]: ErrorCodeRegistry[D][keyof ErrorCodeRegistry[D]]
}[keyof ErrorCodeRegistry]
