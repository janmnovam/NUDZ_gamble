import { type TranslationKey } from '@ui/i18n/types.ts'

/** English mirror of `cs.ts`. Must contain exactly the same keys (enforced by the type). */
export const en: Record<TranslationKey, string> = {
  'common.back': 'Back',
  'common.continue': 'Continue',

  'onboarding.intro.title': 'Get a clear view\nof your gambling',
  'onboarding.intro.lead':
    "Over 28 days you'll record how much time and money you spend gambling. The app turns that into weekly limits and tells you each day how you're doing.",
  'onboarding.intro.bullet.checkin': 'The daily check-in takes 45 seconds',
  'onboarding.intro.bullet.local': 'Your data stays on your phone',
  'onboarding.intro.bullet.export': 'You can export it anytime',
  'onboarding.intro.disclaimer.title': "This isn't treatment",
  'onboarding.intro.disclaimer.body':
    'This app does not replace professional treatment or crisis support. If you need to talk to someone right now, call the First Psychological Aid Line 116 123 — 24/7 and free.',
  'onboarding.intro.cta': 'Start',

  'onboarding.refTime.overline': 'Reference week',
  'onboarding.refTime.title': 'How much time do you usually spend gambling per week?',
  'onboarding.refTime.lead':
    "A rough estimate is fine. It's the baseline the app compares your daily records against.",
  'onboarding.refTime.hoursLabel': 'Hours',
  'onboarding.refTime.minutesLabel': 'Minutes',
  'onboarding.refTime.unitHour': 'h',
  'onboarding.refTime.unitMinute': 'm',
  'onboarding.refTime.sum': '= {count} minutes a week',

  'onboarding.refStakes.overline': 'Reference week',
  'onboarding.refStakes.title': 'How much do you usually stake per week?',
  'onboarding.refStakes.lead': 'We care about the total amount staked — not winnings or net loss.',
  'onboarding.refStakes.fieldLabel': 'Stakes per week',
  'onboarding.refStakes.currency': 'Kč',
  'onboarding.refStakes.helper': 'Whole korunas, no decimals',
  'onboarding.refStakes.why.title': 'Why stakes, not losses?',
  'onboarding.refStakes.why.body':
    'You directly control how much you stake, not the outcome. So the limit is tied to the amount staked. You record winnings only to compute net loss.',

  'onboarding.limits.title': 'Suggested limits for week 1',
  'onboarding.limits.lead':
    'We suggest 80% of your usual week. You can lower it, or raise it — but no higher than 90% of your reference.',
  'onboarding.limits.time.label': 'Time',
  'onboarding.limits.time.sub': 'of {reference}',
  'onboarding.limits.time.note': '80% of {reference} min · cap {cap} min ({capHours} h)',
  'onboarding.limits.stakes.label': 'Stakes',
  'onboarding.limits.stakes.sub': 'of {reference} Kč',
  'onboarding.limits.stakes.note': '80% of {reference} Kč · cap {cap} Kč',
  'onboarding.limits.cap.title': 'The 90% cap is fixed',
  'onboarding.limits.cap.body':
    "You can't set a limit above 90% of your reference week — not now, and not at a later review.",
  'onboarding.limits.unitHour': 'h',
  'onboarding.limits.unitMinute': 'min',
  'onboarding.limits.currency': 'Kč',

  'onboarding.coping.title': 'What will you do when you want to gamble?',
  'onboarding.coping.lead':
    "Pick at least one strategy. We'll remind you of it when you get close to a limit or go over it.",
  'onboarding.coping.custom.label': 'Your own strategy (optional)',
  'onboarding.coping.custom.placeholder': 'Write your own…',
  'onboarding.coping.cta': 'Finish setup',
  'onboarding.coping.selected.one': 'Selected: {count} strategy',
  'onboarding.coping.selected.few': 'Selected: {count} strategies',
  'onboarding.coping.selected.other': 'Selected: {count} strategies',

  'onboarding.placeholder.title': 'This screen is coming soon',
  'onboarding.placeholder.body': "We'll add the remaining onboarding steps in a follow-up.",
}
