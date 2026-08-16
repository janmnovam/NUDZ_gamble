import { ExportServiceImpl } from '@/app/services/exportServiceImpl.ts'
import type { ExportServiceDeps } from '@/app/services/exportServiceImpl.ts'
import type { CheckIn, CopingStrategy, Limit } from '@domain/model.ts'
import type {
  CheckInRepository,
  CopingStrategyRepository,
  LimitRepository,
  ProfileRepository,
} from '@domain/ports.ts'

const USER_ID = 'A001'

function makeService(): ExportServiceImpl {
  const checkIn: CheckIn = {
    checkInId: 'c1',
    userId: USER_ID,
    behaviorDate: '2026-09-01T00:00:00.000Z',
    weekNo: 1,
    played: true,
    timeMin: 60,
    stakesCzk: 500,
    winningsCzk: 0,
    submittedAt: '2026-09-02T08:00:00+02:00',
    updatedAt: null,
  }
  const limit: Limit = {
    limitId: 'l1',
    userId: USER_ID,
    weekNo: 1,
    weeklyLimitTimeMin: 480,
    weeklyLimitStakesCzk: 8_000,
    limitSetAt: '2026-08-31T21:30:00+02:00',
  }
  const strategy: CopingStrategy = {
    copingStrategyId: 'cs1',
    userId: USER_ID,
    label: 'Jít na 15 minut ven',
    type: 'default',
    priority: 1,
    active: true,
    createdAt: '2026-08-31T21:30:00+02:00',
    updatedAt: null,
  }
  const checkIns: CheckInRepository = {
    listByUser: () => Promise.resolve([checkIn]),
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  const limits: LimitRepository = {
    listByUser: () => Promise.resolve([limit]),
    save: () => Promise.resolve(),
  }
  const copingStrategies: CopingStrategyRepository = {
    listByUser: () => Promise.resolve([strategy]),
    loadDefaults: () => Promise.resolve([]),
    create: (input) =>
      Promise.resolve({
        copingStrategyId: 'new',
        active: true,
        createdAt: '',
        updatedAt: null,
        ...input,
      }),
    setActive: () => Promise.resolve(),
  }
  const profiles: ProfileRepository = {
    get: () => Promise.resolve(undefined),
    save: () => Promise.resolve(),
  }
  const deps: ExportServiceDeps = { profiles, checkIns, limits, copingStrategies }
  return new ExportServiceImpl(deps)
}

describe('ExportServiceImpl.exportDataZip', () => {
  it('bundles profile.csv, check_in.csv, limit.csv and coping_strategy.csv into one ZIP archive', async () => {
    const zip = await makeService().exportDataZip(USER_ID, '2026-09-01T12:00:00.000Z')

    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
    expect(view.getUint32(0, true)).toBe(0x04034b50) // first local file header

    const names = extractEntryNames(zip)
    expect(names).toEqual(['profile.csv', 'check_in.csv', 'limit.csv', 'coping_strategy.csv'])
  })
})

/** Walks the ZIP's local file headers (store method, fixed 30-byte header) to read out each entry's name. */
function extractEntryNames(zip: Uint8Array): string[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
  const names: string[] = []
  let offset = 0
  while (offset < zip.length && view.getUint32(offset, true) === 0x04034b50) {
    const nameLen = view.getUint16(offset + 26, true)
    const dataLen = view.getUint32(offset + 18, true)
    names.push(new TextDecoder().decode(zip.subarray(offset + 30, offset + 30 + nameLen)))
    offset += 30 + nameLen + dataLen
  }
  return names
}
