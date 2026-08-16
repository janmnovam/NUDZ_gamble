import { CopingStrategyServiceImpl } from '@/app/services/copingStrategyServiceImpl.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { CopingStrategyDefault } from '@domain/model.ts'
import type { CopingStrategyRepository } from '@domain/ports.ts'

describe('CopingStrategyServiceImpl.getSuggestions', () => {
  it('maps the domain defaults to { id, label, type } picker options (code → id)', async () => {
    const defaults: CopingStrategyDefault[] = [
      { code: 'change_environment', label: 'Na chvíli změním prostředí', priority: 1 },
      { code: 'reach_out', label: 'Ozvu se někomu, komu důvěřuji', priority: 2 },
    ]
    const repo = {
      loadDefaults: () => Promise.resolve(defaults),
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await expect(service.getSuggestions('demo-user', '2026-09-01T12:00:00.000Z')).resolves.toEqual([
      { id: 'change_environment', label: 'Na chvíli změním prostředí', type: 'default' },
      { id: 'reach_out', label: 'Ozvu se někomu, komu důvěřuji', type: 'default' },
    ])
  })

  it('wires up through createApp against the seeded defaults', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const suggestions = await service.getSuggestions('demo-user', '2026-09-01T12:00:00.000Z')
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(typeof suggestions[0]?.id).toBe('string')
    expect(typeof suggestions[0]?.label).toBe('string')

    db.close()
    await db.delete()
  })
})
