import { toCopingSuggestionDto } from '@/app/mappers/copingMapper.ts'
import type { CopingStrategyDto, CopingSuggestionDto } from '@/app/dto/coping.ts'
import { copingDefaultToDomain } from '@data/mappers.ts'
import { COPING_STRATEGY_DEFAULTS } from '@data/seeds/copingDefaults.ts'
import {
  buildCatalogStrategyDetails,
  buildCatalogStrategyPresentation,
} from '@ui/coping/catalogStrategyDetails.ts'

const CATALOG = [
  ['change_environment', 'Na chvíli odejdu od hraní'],
  ['reach_out', 'Ozvu se někomu, komu důvěřuji'],
  ['let_urge_pass', 'S rozhodnutím chvíli počkám'],
  ['start_small_activity', 'Pustím se do něčeho jiného'],
  ['remember_why', 'Připomenu si, proč chci hrát méně'],
  ['reduce_access', 'Omezím si přístup ke hraní'],
] as const

// Suggestions carry their detail content through the real seed → domain →
// DTO pipeline, so this test exercises the actual DB-backed join, not a
// hand-typed stand-in for it.
const suggestions: CopingSuggestionDto[] =
  COPING_STRATEGY_DEFAULTS.map(copingDefaultToDomain).map(toCopingSuggestionDto)

const strategies: CopingStrategyDto[] = CATALOG.map(([, label], index) => ({
  id: `persisted-${String(index + 1)}`,
  label,
  type: 'default',
  active: index < 2,
  priority: index + 1,
  whenToUse: null,
  howToStart: null,
}))

describe('buildCatalogStrategyDetails', () => {
  it('maps all six catalogue contents to their persisted strategy ids', () => {
    const details = buildCatalogStrategyDetails(strategies, suggestions)

    expect(details).toHaveLength(6)
    expect(details.map(({ id }) => id)).toEqual([
      'persisted-1',
      'persisted-2',
      'persisted-3',
      'persisted-4',
      'persisted-5',
      'persisted-6',
    ])
    expect(
      details.every(({ whatToDo, whyItCanHelp, howTo, whenUseful, note }) =>
        [whatToDo, whyItCanHelp, howTo, whenUseful, note].every((value) => value.trim().length > 0),
      ),
    ).toBe(true)
  })

  it('includes both official restriction links only for the access strategy', () => {
    const details = buildCatalogStrategyDetails(strategies, suggestions)
    const accessDetail = details.find(({ id }) => id === 'persisted-6')

    expect(accessDetail?.restrictionOptions?.items).toHaveLength(2)
    expect(
      details
        .filter(({ id }) => id !== 'persisted-6')
        .every(({ restrictionOptions }) => restrictionOptions === undefined),
    ).toBe(true)
  })

  it('does not create a detail for custom or unknown catalogue strategies', () => {
    const unknown: CopingStrategyDto = {
      id: 'unknown',
      label: 'Nová nepopsaná strategie',
      type: 'default',
      active: false,
      priority: 1,
      whenToUse: null,
      howToStart: null,
    }
    const custom: CopingStrategyDto = {
      id: 'custom',
      label: 'Vlastní strategie',
      type: 'custom',
      active: false,
      priority: 2,
      whenToUse: null,
      howToStart: null,
    }

    expect(buildCatalogStrategyDetails([unknown, custom], suggestions)).toEqual([])
  })

  it('uses current Figma copy for a strategy persisted under its legacy label', () => {
    const legacyStrategy: CopingStrategyDto = {
      id: 'persisted-legacy',
      label: 'Na chvíli změním prostředí',
      type: 'default',
      active: true,
      priority: 1,
      whenToUse: null,
      howToStart: null,
    }

    const details = buildCatalogStrategyDetails([legacyStrategy], suggestions)
    const presentation = buildCatalogStrategyPresentation(suggestions).get(legacyStrategy.label)

    expect(details[0]?.title).toBe('Na chvíli odejdu od hraní')
    expect(presentation).toEqual({
      title: 'Na chvíli odejdu od hraní',
      summary: '',
    })
  })
})
