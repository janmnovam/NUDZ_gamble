import { type CopingStrategyDefaultEntity } from '@data/model.ts'

// Catalog ("default") coping strategies, in order, from content.md § Katalog strategií.
// `code` is a stable id (renaming = migration). PROVISIONAL — confirm with NUDZ.
export const COPING_STRATEGY_DEFAULTS: readonly CopingStrategyDefaultEntity[] = [
  {
    code: 'change_environment',
    label: 'Na chvíli změním prostředí',
    priority: 1,
    reminder_text: 'Vytvořím si krátký odstup od místa nebo zařízení spojeného s hraním.',
  },
  {
    code: 'reach_out',
    label: 'Ozvu se někomu, komu důvěřuji',
    priority: 2,
    reminder_text: 'Navážu krátký kontakt a nezůstanu s nutkáním bez podpory.',
  },
  {
    code: 'let_urge_pass',
    label: 'Nechám nutkání chvíli projít',
    priority: 3,
    reminder_text: 'Všimnu si nutkání, ale nemusím podle něj hned jednat.',
  },
  {
    code: 'start_small_activity',
    label: 'Začnu jinou krátkou činnost',
    priority: 4,
    reminder_text: 'Zaměřím pozornost na malý krok, se kterým lze začít hned.',
  },
  {
    code: 'remember_why',
    label: 'Připomenu si, co chci chránit',
    priority: 5,
    reminder_text: 'Vrátím pozornost k tomu, proč chci mít hraní více pod kontrolou.',
  },
  {
    code: 'reduce_access',
    label: 'Znesnadním si přístup ke hraní',
    priority: 6,
    reminder_text: 'Vytvořím mezi nutkáním a hraním praktickou překážku.',
  },
]
