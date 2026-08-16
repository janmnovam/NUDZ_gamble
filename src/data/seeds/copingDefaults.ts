import { type CopingStrategyDefaultEntity } from '@data/model.ts'

// Catalog ("default") coping strategies, in the order and wording from Figma.
// `code` is a stable id (renaming = migration). PROVISIONAL — confirm with NUDZ.
export const COPING_STRATEGY_DEFAULTS: readonly CopingStrategyDefaultEntity[] = [
  {
    code: 'change_environment',
    label: 'Na chvíli odejdu od hraní',
    priority: 1,
    reminder_text: 'Zavřu stránku nebo aplikaci, odložím zařízení nebo se přesunu jinam.',
  },
  {
    code: 'reach_out',
    label: 'Ozvu se někomu, komu důvěřuji',
    priority: 2,
    reminder_text: 'Ozvu se člověku, se kterým se cítím bezpečně a nemusím mu všechno vysvětlovat.',
  },
  {
    code: 'let_urge_pass',
    label: 'S rozhodnutím chvíli počkám',
    priority: 3,
    reminder_text: 'Dám si deset minut, během kterých nemusím nic rozhodovat.',
  },
  {
    code: 'start_small_activity',
    label: 'Pustím se do něčeho jiného',
    priority: 4,
    reminder_text: 'Vrátím pozornost k tomu, co je pro mě důležité a proč chci hraní omezit.',
  },
  {
    code: 'remember_why',
    label: 'Připomenu si, proč chci hrát méně',
    priority: 5,
    reminder_text: 'Vrátím pozornost k tomu, co je pro mě důležité a proč chci hraní omezit.',
  },
  {
    code: 'reduce_access',
    label: 'Omezím si přístup ke hraní',
    priority: 6,
    reminder_text: 'Odhlásím se, odstraním uloženou platbu nebo využiju blokaci či sebevyloučení.',
  },
]
