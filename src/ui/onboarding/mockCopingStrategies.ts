/**
 * ⚠️ TEMPORARY UI PLACEHOLDER — NOT the source of truth.
 *
 * The predefined coping strategies are domain data loaded from the DB (outside
 * the UI team's scope). This mock only exists so the coping screen is
 * interactive and demoable before that lands. Replace it with the real list
 * (e.g. provided by the domain layer) when available — the labels are content,
 * not UI copy, so they do not go through the translator.
 */
export interface CopingStrategy {
  id: string
  label: string
}

export const MOCK_COPING_STRATEGIES: CopingStrategy[] = [
  { id: 'walk', label: 'Půjdu na 15 minut ven' },
  { id: 'call', label: 'Zavolám někomu blízkému' },
  { id: 'shower', label: 'Dám si sprchu' },
  { id: 'journal', label: 'Napíšu si, co právě cítím' },
  { id: 'run', label: 'Zajdu si zaběhat' },
]
