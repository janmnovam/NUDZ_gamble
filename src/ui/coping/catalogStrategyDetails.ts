import type { CopingStrategyDto, CopingSuggestionDto } from '@/app/dto/coping.ts'
import type { CatalogStrategyDetail } from '@ui/coping/CatalogStrategyDetailScreen.tsx'

type CatalogStrategyDetailContent = Omit<CatalogStrategyDetail, 'id'>

interface CatalogStrategyPresentation {
  title: string
  summary: string
}

const LEGACY_LABEL_BY_CODE: Readonly<Record<string, string>> = {
  change_environment: 'Na chvíli změním prostředí',
  reach_out: 'Ozvu se někomu, komu důvěřuji',
  let_urge_pass: 'Nechám nutkání chvíli projít',
  start_small_activity: 'Začnu jinou krátkou činnost',
  remember_why: 'Připomenu si, co chci chránit',
  reduce_access: 'Znesnadním si přístup ke hraní',
}

function labelsForSuggestion(suggestion: CopingSuggestionDto): string[] {
  const legacyLabel = LEGACY_LABEL_BY_CODE[suggestion.id]
  return legacyLabel === undefined || legacyLabel === suggestion.label
    ? [suggestion.label]
    : [suggestion.label, legacyLabel]
}

/** Current Figma copy, also keyed by legacy labels already persisted on devices. */
export function buildCatalogStrategyPresentation(
  suggestions: readonly CopingSuggestionDto[],
): ReadonlyMap<string, CatalogStrategyPresentation> {
  const presentationByLabel = new Map<string, CatalogStrategyPresentation>()

  for (const suggestion of suggestions) {
    const presentation = {
      title: suggestion.label,
      summary: suggestion.summary ?? '',
    }
    for (const label of labelsForSuggestion(suggestion)) {
      presentationByLabel.set(label, presentation)
    }
  }

  return presentationByLabel
}

/**
 * Detail-screen copy is carried on the suggestion DTO itself (sourced from
 * `CopingStrategyDefault`, ultimately `src/data/seeds/copingDefaults.ts`) —
 * a suggestion missing any required field has no catalog detail screen.
 */
function detailContentFromSuggestion(
  suggestion: CopingSuggestionDto,
): CatalogStrategyDetailContent | undefined {
  const { title, whatToDo, whyItCanHelp, howTo, whenUseful, note, noteLabel, restrictionOptions } =
    suggestion
  if (
    title === undefined ||
    whatToDo === undefined ||
    whyItCanHelp === undefined ||
    howTo === undefined ||
    whenUseful === undefined ||
    note === undefined
  ) {
    return undefined
  }

  return {
    title,
    whatToDo,
    whyItCanHelp,
    howTo,
    whenUseful,
    note,
    ...(noteLabel === undefined ? {} : { noteLabel }),
    ...(restrictionOptions === undefined ? {} : { restrictionOptions }),
  }
}

/**
 * Joins stable catalogue codes from `getSuggestions` with the per-user ids
 * returned by `list`. The current persisted row keeps the catalogue label but
 * not its code, so the service-provided label is the join key at this boundary.
 */
export function buildCatalogStrategyDetails(
  strategies: readonly CopingStrategyDto[],
  suggestions: readonly CopingSuggestionDto[],
): CatalogStrategyDetail[] {
  const contentByLabel = new Map<string, CatalogStrategyDetailContent>()

  for (const suggestion of suggestions) {
    const content = detailContentFromSuggestion(suggestion)
    if (content !== undefined) {
      for (const label of labelsForSuggestion(suggestion)) {
        contentByLabel.set(label, content)
      }
    }
  }

  return strategies.flatMap((strategy) => {
    if (strategy.type !== 'default') return []

    const content = contentByLabel.get(strategy.label)
    return content === undefined ? [] : [{ id: strategy.id, ...content }]
  })
}
