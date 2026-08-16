import { jest } from '@jest/globals'

import { CopingStrategyServiceImpl } from '@/app/services/copingStrategyServiceImpl.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { CopingStrategy, CopingStrategyDefault } from '@domain/model.ts'
import type { CopingStrategyRepository } from '@domain/ports.ts'

const TIME = '2026-09-04T08:00:00+02:00'
const USER_ID = 'demo-user'

describe('CopingStrategyServiceImpl.getSuggestions', () => {
  it('maps the domain defaults to picker options with an optional library summary', async () => {
    const defaults: CopingStrategyDefault[] = [
      {
        code: 'change_environment',
        label: 'Na chvíli změním prostředí',
        priority: 1,
        reminderText: 'Vytvořím si krátký odstup.',
      },
      { code: 'reach_out', label: 'Ozvu se někomu, komu důvěřuji', priority: 2 },
    ]
    const repo = {
      loadDefaults: () => Promise.resolve(defaults),
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await expect(service.getSuggestions('demo-user', '2026-09-01T12:00:00.000Z')).resolves.toEqual([
      {
        id: 'change_environment',
        label: 'Na chvíli změním prostředí',
        type: 'default',
        summary: 'Vytvořím si krátký odstup.',
      },
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

describe('CopingStrategyServiceImpl.list', () => {
  it('maps the user’s persisted strategies to { id, label, type, active, priority }', async () => {
    const strategies: CopingStrategy[] = [
      {
        copingStrategyId: 'c1',
        userId: 'demo-user',
        label: 'Na chvíli změním prostředí',
        type: 'default',
        priority: 1,
        active: true,
        createdAt: TIME,
        updatedAt: null,
      },
    ]
    const repo = {
      listByUser: () => Promise.resolve(strategies),
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await expect(service.list(USER_ID, TIME)).resolves.toEqual([
      { id: 'c1', label: 'Na chvíli změním prostředí', type: 'default', active: true, priority: 1 },
    ])
  })
})

describe('CopingStrategyServiceImpl.create', () => {
  it('trims the label, appends after the highest existing priority, and always writes type "custom"', async () => {
    const existing: CopingStrategy[] = [
      {
        copingStrategyId: 'c1',
        userId: 'demo-user',
        label: 'Existing',
        type: 'default',
        priority: 2,
        active: true,
        createdAt: TIME,
        updatedAt: null,
      },
    ]
    const create = jest.fn(
      (input: { userId: string; label: string; type: string; priority: number }, time: string) =>
        Promise.resolve({
          copingStrategyId: 'new-id',
          userId: input.userId,
          label: input.label,
          type: input.type,
          priority: input.priority,
          active: true,
          createdAt: time,
          updatedAt: null,
        } as CopingStrategy),
    )
    const repo = {
      listByUser: () => Promise.resolve(existing),
      create,
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    const result = await service.create({ label: '  Zavolat bratrovi  ' }, USER_ID, TIME)

    expect(create).toHaveBeenCalledWith(
      { userId: 'demo-user', label: 'Zavolat bratrovi', type: 'custom', priority: 3 },
      TIME,
    )
    expect(result).toEqual({
      id: 'new-id',
      label: 'Zavolat bratrovi',
      type: 'custom',
      active: true,
      priority: 3,
    })
  })

  it('rejects an empty label without touching the repo', async () => {
    const create = jest.fn()
    const repo = {
      listByUser: () => Promise.resolve([]),
      create,
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await expect(service.create({ label: '   ' }, USER_ID, TIME)).rejects.toThrow(
      'coping: label must not be empty',
    )
    expect(create).not.toHaveBeenCalled()
  })

  it('wires up through createDataLayer and persists the created strategy', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const created = await service.create({ label: 'Jít na procházku' }, USER_ID, TIME)
    const listed = await service.list(USER_ID, TIME)

    expect(listed).toContainEqual(created)

    db.close()
    await db.delete()
  })
})

describe('CopingStrategyServiceImpl.toggle', () => {
  it('delegates to repo.setActive', async () => {
    const setActive = jest.fn(() => Promise.resolve())
    const repo = { setActive } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await service.toggle('c1', false, USER_ID, TIME)

    expect(setActive).toHaveBeenCalledWith('c1', false, TIME)
  })

  it('rejects an empty id without touching the repo', async () => {
    const setActive = jest.fn()
    const repo = { setActive } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await expect(service.toggle('  ', true, USER_ID, TIME)).rejects.toThrow(
      'coping: copingStrategyId must not be empty',
    )
    expect(setActive).not.toHaveBeenCalled()
  })

  it('propagates the repo error for an unknown id (no silent swallowing)', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    await expect(service.toggle('does-not-exist', false, USER_ID, TIME)).rejects.toThrow(
      'coping_strategy not found: does-not-exist',
    )

    db.close()
    await db.delete()
  })
})
