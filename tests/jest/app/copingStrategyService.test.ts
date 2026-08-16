import { jest } from '@jest/globals'

import { CopingStrategyServiceImpl } from '@/app/services/copingStrategyServiceImpl.ts'
import { ok, type Result } from '@/app/result.ts'
import { AppDatabase, createDataLayer, type DataLayer } from '@/core'
import type { CopingStrategy, CopingStrategyDefault, UserId } from '@domain/model.ts'
import type { CopingStrategyRepository } from '@domain/ports.ts'

const TIME = '2026-09-04T08:00:00+02:00'
const USER_ID = 'demo-user'

/** Unwrap a service `Result`, failing the test if it carried an envelope error. */
function unwrap<T>(r: Result<T>): T {
  if (r.error) throw new Error(`unexpected error envelope: ${r.error.type}:${r.error.code}`)
  if (r.data === null) throw new Error('expected data, got null')
  return r.data
}

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

    await expect(service.getSuggestions('2026-09-01T12:00:00.000Z')).resolves.toEqual(
      ok([
        {
          id: 'change_environment',
          label: 'Na chvíli změním prostředí',
          type: 'default',
          summary: 'Vytvořím si krátký odstup.',
        },
        { id: 'reach_out', label: 'Ozvu se někomu, komu důvěřuji', type: 'default' },
      ]),
    )
  })

  it('wires up through createApp against the seeded defaults', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const suggestions = unwrap(await service.getSuggestions('2026-09-01T12:00:00.000Z'))
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
        whenToUse: null,
        howToStart: null,
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

    await expect(service.list(USER_ID, TIME)).resolves.toEqual(
      ok([
        {
          id: 'c1',
          label: 'Na chvíli změním prostředí',
          type: 'default',
          active: true,
          priority: 1,
          whenToUse: null,
          howToStart: null,
        },
      ]),
    )
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
        whenToUse: null,
        howToStart: null,
        priority: 2,
        active: true,
        createdAt: TIME,
        updatedAt: null,
      },
    ]
    const create = jest.fn(
      (
        input: {
          userId: UserId
          label: string
          type: string
          priority: number
          whenToUse: string | null
          howToStart: string | null
        },
        time: string,
      ) =>
        Promise.resolve({
          copingStrategyId: 'new-id',
          userId: input.userId,
          label: input.label,
          type: input.type,
          whenToUse: input.whenToUse,
          howToStart: input.howToStart,
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

    const result = unwrap(await service.create({ label: '  Zavolat bratrovi  ' }, USER_ID, TIME))

    expect(create).toHaveBeenCalledWith(
      {
        userId: 'demo-user',
        label: 'Zavolat bratrovi',
        type: 'custom',
        whenToUse: null,
        howToStart: null,
        priority: 3,
      },
      TIME,
    )
    expect(result).toEqual({
      id: 'new-id',
      label: 'Zavolat bratrovi',
      type: 'custom',
      active: true,
      priority: 3,
      whenToUse: null,
      howToStart: null,
    })
  })

  it('trims and stores the optional whenToUse/howToStart detail fields', async () => {
    const create = jest.fn(
      (
        input: {
          userId: string
          label: string
          type: string
          priority: number
          whenToUse: string | null
          howToStart: string | null
        },
        time: string,
      ) =>
        Promise.resolve({
          copingStrategyId: 'new-id',
          userId: input.userId,
          label: input.label,
          type: input.type,
          whenToUse: input.whenToUse,
          howToStart: input.howToStart,
          priority: input.priority,
          active: true,
          createdAt: time,
          updatedAt: null,
        } as CopingStrategy),
    )
    const repo = {
      listByUser: () => Promise.resolve([]),
      create,
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    const result = unwrap(
      await service.create(
        { label: 'Zavolat bratrovi', whenToUse: '  Když mám nutkání  ', howToStart: '   ' },
        USER_ID,
        TIME,
      ),
    )

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ whenToUse: 'Když mám nutkání', howToStart: null }),
      TIME,
    )
    expect(result.whenToUse).toBe('Když mám nutkání')
    expect(result.howToStart).toBeNull()
  })

  it('rejects an empty label without touching the repo', async () => {
    const create = jest.fn()
    const repo = {
      listByUser: () => Promise.resolve([]),
      create,
    } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    const res = await service.create({ label: '   ' }, USER_ID, TIME)
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('COPING_EMPTY_LABEL')
    expect(create).not.toHaveBeenCalled()
  })

  it('wires up through createDataLayer and persists the created strategy', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const created = unwrap(await service.create({ label: 'Jít na procházku' }, USER_ID, TIME))
    const listed = unwrap(await service.list(USER_ID, TIME))

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

    const res = await service.toggle('  ', true, USER_ID, TIME)
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('COPING_EMPTY_ID')
    expect(setActive).not.toHaveBeenCalled()
  })

  it('propagates the repo error for an unknown id (no silent swallowing)', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const res = await service.toggle('does-not-exist', false, USER_ID, TIME)
    expect(res.data).toBeNull()
    // A repo throw (unknown id) is surfaced as an envelope, not silently swallowed.
    expect(res.error).not.toBeNull()

    db.close()
    await db.delete()
  })
})

describe('CopingStrategyServiceImpl.update', () => {
  it('normalizes and delegates only the supplied fields to repo.update', async () => {
    const update = jest.fn((id: string, _changes: unknown, time: string) =>
      Promise.resolve({
        copingStrategyId: id,
        userId: 'demo-user',
        label: 'Zavolat bratrovi',
        type: 'custom',
        whenToUse: 'Když mám nutkání',
        howToStart: null,
        priority: 1,
        active: true,
        createdAt: TIME,
        updatedAt: time,
      } as CopingStrategy),
    )
    const repo = { update } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    const result = unwrap(
      await service.update(
        'c1',
        { label: '  Zavolat bratrovi  ', whenToUse: '  Když mám nutkání  ' },
        USER_ID,
        TIME,
      ),
    )

    expect(update).toHaveBeenCalledWith(
      'c1',
      { label: 'Zavolat bratrovi', whenToUse: 'Když mám nutkání' },
      TIME,
    )
    expect(result).toEqual({
      id: 'c1',
      label: 'Zavolat bratrovi',
      type: 'custom',
      active: true,
      priority: 1,
      whenToUse: 'Když mám nutkání',
      howToStart: null,
    })
  })

  it('rejects an empty id without touching the repo', async () => {
    const update = jest.fn()
    const repo = { update } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    const res = await service.update('  ', { label: 'x' }, USER_ID, TIME)
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('COPING_EMPTY_ID')
    expect(update).not.toHaveBeenCalled()
  })

  it('rejects an empty label', async () => {
    const update = jest.fn()
    const repo = { update } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    const res = await service.update('c1', { label: '   ' }, USER_ID, TIME)
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('COPING_EMPTY_LABEL')
    expect(update).not.toHaveBeenCalled()
  })

  it('wires up through createDataLayer: edits a custom strategy end to end', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const created = unwrap(await service.create({ label: 'Jít na procházku' }, USER_ID, TIME))
    const updated = unwrap(
      await service.update(
        created.id,
        { whenToUse: 'Když mám nutkání', howToStart: 'Obuju si boty' },
        USER_ID,
        TIME,
      ),
    )

    expect(updated).toEqual({
      ...created,
      whenToUse: 'Když mám nutkání',
      howToStart: 'Obuju si boty',
    })
    const listed = unwrap(await service.list(USER_ID, TIME))
    expect(listed).toContainEqual(updated)

    db.close()
    await db.delete()
  })

  it('rejects editing a catalog (default) strategy through createDataLayer', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const suggestions = unwrap(await service.getSuggestions(TIME))
    const defaultSuggestion = suggestions[0]
    if (defaultSuggestion === undefined) throw new Error('expected at least one default suggestion')
    const adopted = await data.copingStrategies.create(
      { userId: USER_ID, label: defaultSuggestion.label, type: 'default', priority: 1 },
      TIME,
    )

    const res = await service.update(
      adopted.copingStrategyId,
      { label: 'Nový název' },
      USER_ID,
      TIME,
    )
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('COPING_NOT_EDITABLE')

    db.close()
    await db.delete()
  })

  it('propagates the repo error for an unknown id (no silent swallowing)', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const res = await service.update('does-not-exist', { label: 'x' }, USER_ID, TIME)
    expect(res.data).toBeNull()
    expect(res.error).not.toBeNull()

    db.close()
    await db.delete()
  })
})

describe('CopingStrategyServiceImpl.remove', () => {
  it('delegates to repo.remove', async () => {
    const remove = jest.fn(() => Promise.resolve())
    const repo = { remove } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    await service.remove('c1', USER_ID)

    expect(remove).toHaveBeenCalledWith('c1')
  })

  it('rejects an empty id without touching the repo', async () => {
    const remove = jest.fn()
    const repo = { remove } as unknown as CopingStrategyRepository
    const service = new CopingStrategyServiceImpl({ repo })

    const res = await service.remove('  ', USER_ID)
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('COPING_EMPTY_ID')
    expect(remove).not.toHaveBeenCalled()
  })

  it('wires up through createDataLayer: deletes a custom strategy end to end', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const created = unwrap(await service.create({ label: 'Jít na procházku' }, USER_ID, TIME))
    const res = await service.remove(created.id, USER_ID)
    expect(res.error).toBeNull()

    const listed = unwrap(await service.list(USER_ID, TIME))
    expect(listed).not.toContainEqual(created)

    db.close()
    await db.delete()
  })

  it('rejects deleting a catalog (default) strategy through createDataLayer', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const suggestions = unwrap(await service.getSuggestions(TIME))
    const defaultSuggestion = suggestions[0]
    if (defaultSuggestion === undefined) throw new Error('expected at least one default suggestion')
    const adopted = await data.copingStrategies.create(
      { userId: USER_ID, label: defaultSuggestion.label, type: 'default', priority: 1 },
      TIME,
    )

    const res = await service.remove(adopted.copingStrategyId, USER_ID)
    expect(res.data).toBeNull()
    expect(res.error?.type).toBe('validation')
    expect(res.error?.code).toBe('COPING_NOT_DELETABLE')

    db.close()
    await db.delete()
  })

  it('propagates the repo error for an unknown id (no silent swallowing)', async () => {
    const db = new AppDatabase(`nudz-gamble-jest-${crypto.randomUUID()}`)
    const data: DataLayer = createDataLayer(db)
    const service = new CopingStrategyServiceImpl({ repo: data.copingStrategies })

    const res = await service.remove('does-not-exist', USER_ID)
    expect(res.data).toBeNull()
    expect(res.error).not.toBeNull()

    db.close()
    await db.delete()
  })
})
