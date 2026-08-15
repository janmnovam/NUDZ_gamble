/**
 * Czech is the source of truth. Every user-facing string lives here as a flat
 * key/value pair; `en.ts` is a key-for-key mirror. Keep the two in sync — the
 * type of `en` is derived from these keys, so a missing/extra key fails typecheck.
 *
 * `{name}` placeholders are filled at runtime via the translator's second argument.
 */
export const cs = {
  'common.back': 'Zpět',
  'common.continue': 'Pokračovat',

  'onboarding.intro.title': 'Získej přehled\nnad svým hraním',
  'onboarding.intro.lead':
    '28 dní si budeš zapisovat, kolik času a peněz jsi hraní věnoval. Aplikace ti z toho spočítá týdenní limity a každý den ti řekne, jak na tom jsi.',
  'onboarding.intro.bullet.checkin': 'Denní check-in zabere 45 sekund',
  'onboarding.intro.bullet.local': 'Data zůstávají v tvém telefonu',
  'onboarding.intro.bullet.export': 'Kdykoli si je můžeš exportovat',
  'onboarding.intro.disclaimer.title': 'Tohle není léčba',
  'onboarding.intro.disclaimer.body':
    'Aplikace nenahrazuje odbornou léčbu ani krizovou pomoc. Když potřebuješ mluvit s někým hned, zavolej Linku první psychické pomoci 116 123 — nonstop a zdarma.',
  'onboarding.intro.cta': 'Začít',

  'onboarding.refTime.overline': 'Referenční týden',
  'onboarding.refTime.title': 'Kolik času obvykle věnuješ hraní za týden?',
  'onboarding.refTime.lead':
    'Stačí odhad. Je to výchozí stav, se kterým aplikace porovnává tvé denní záznamy.',
  'onboarding.refTime.hoursLabel': 'Hodiny',
  'onboarding.refTime.minutesLabel': 'Minuty',
  'onboarding.refTime.unitHour': 'h',
  'onboarding.refTime.unitMinute': 'm',
  'onboarding.refTime.sum': '= {count} minut za týden',

  'onboarding.refStakes.overline': 'Referenční týden',
  'onboarding.refStakes.title': 'Kolik obvykle vsadíš za týden?',
  'onboarding.refStakes.lead': 'Zajímá nás celková vsazená částka — ne výhry ani čistá ztráta.',
  'onboarding.refStakes.fieldLabel': 'Sázky za týden',
  'onboarding.refStakes.currency': 'Kč',
  'onboarding.refStakes.helper': 'Celé koruny, bez desetinných míst',
  'onboarding.refStakes.why.title': 'Proč sázky, a ne prohra?',
  'onboarding.refStakes.why.body':
    'Výši sázek ovlivníš přímo, výsledek hry ne. Limit se proto váže na vsazenou částku. Výhry si zapisuješ jen kvůli výpočtu čisté ztráty.',

  'onboarding.limits.title': 'Návrh limitů na týden 1',
  'onboarding.limits.lead':
    'Doporučujeme 80 % tvého běžného týdne. Limit můžeš snížit, nebo zvýšit — nejvýš ale na 90 % reference.',
  'onboarding.limits.time.label': 'Čas',
  'onboarding.limits.time.sub': 'z {reference}',
  'onboarding.limits.time.note': '80 % z {reference} min · strop {cap} min ({capHours} h)',
  'onboarding.limits.stakes.label': 'Sázky',
  'onboarding.limits.stakes.sub': 'z {reference} Kč',
  'onboarding.limits.stakes.note': '80 % z {reference} Kč · strop {cap} Kč',
  'onboarding.limits.cap.title': 'Strop 90 % je pevný',
  'onboarding.limits.cap.body':
    'Limit nelze nastavit nad 90 % referenčního týdne — ani teď, ani při pozdějším review.',
  'onboarding.limits.unitHour': 'h',
  'onboarding.limits.unitMinute': 'min',
  'onboarding.limits.currency': 'Kč',

  'onboarding.coping.title': 'Co uděláš, když budeš chtít hrát?',
  'onboarding.coping.lead':
    'Vyber aspoň jednu strategii. Připomeneme ti ji, když se přiblížíš limitu nebo ho překročíš.',
  'onboarding.coping.custom.label': 'Vlastní strategie (nepovinné)',
  'onboarding.coping.custom.placeholder': 'Napiš vlastní…',
  'onboarding.coping.cta': 'Dokončit nastavení',
  'onboarding.coping.selected.one': 'Vybráno: {count} strategie',
  'onboarding.coping.selected.few': 'Vybráno: {count} strategie',
  'onboarding.coping.selected.other': 'Vybráno: {count} strategií',

  'onboarding.done.title': 'Vše je nastaveno',
  'onboarding.done.row.reference': 'Referenční týden',
  'onboarding.done.row.limits': 'Limity na týden 1',
  'onboarding.done.row.coping': 'Copingové strategie',
  'onboarding.done.coping.one': '{count} vybraná',
  'onboarding.done.coping.few': '{count} vybrané',
  'onboarding.done.coping.other': '{count} vybraných',
  'onboarding.done.banner.title': 'Začínáme zítra, {date}',
  'onboarding.done.banner.body': 'Každý den se počítá, nezapomeň si zítra zapsat svůj pokrok.',
  'onboarding.done.cta': 'Rozumím',
} as const
