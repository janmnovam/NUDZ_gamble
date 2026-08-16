import { CopingStrategyServiceImpl } from '@/app/services/copingStrategyServiceImpl.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { CopingStrategyDefault } from '@domain/model.ts'
import type { CopingStrategyRepository } from '@domain/ports.ts'

describe('CopingStrategyServiceImpl.getSuggestions', () => {
  it('maps the domain defaults to { id, label } picker options (code → id)', async () => {
    const defaults: CopingStrategyDefault[] = [
      { code: 'change_environment', label: 'Na chvíli změním prostředí', priority: 1 },
      { code: 'reach_out', label: 'Ozvu se někomu, komu důvěřuji', priority: 2 },
    ]
    const repo = {
      loadDefaults: () => Promise.resolve(defaults),
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await expect(service.getSuggestions()).resolves.toEqual([
      { id: 'change_environment', label: 'Na chvíli změním prostředí' },
      { id: 'reach_out', label: 'Ozvu se někomu, komu důvěřuji' },
    ])
  })

  it('wires up through createApp against the seeded defaults', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const suggestions = await service.getSuggestions()
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(typeof suggestions[0]?.id).toBe('string')
    expect(typeof suggestions[0]?.label).toBe('string')

    db.close()
    await db.delete()
  })
})
