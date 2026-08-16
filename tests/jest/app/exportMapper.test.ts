import { toCheckInCsv, toCopingStrategyCsv, toLimitCsv } from '@/app/mappers/exportMapper.ts'
import type { CheckIn, CopingStrategy, Limit } from '@domain/model.ts'

describe('toCheckInCsv', () => {
  it('emits the stable header and one row per check-in', () => {
    const checkIn: CheckIn = {
      checkInId: 'c1',
      userId: 'A001',
      behaviorDate: '2026-09-01T00:00:00.000Z',
      weekNo: 1,
      played: true,
      timeMin: 60,
      stakesCzk: 500,
      winningsCzk: 0,
      submittedAt: '2026-09-02T08:00:00+02:00',
      updatedAt: null,
    }
    const csv = toCheckInCsv([checkIn])
    const lines = csv.trim().split('\r\n')
    expect(lines[0]).toBe(
      'check_in_id,user_id,behavior_date,played,time_min,stakes_czk,winnings_czk,submitted_at,updated_at',
    )
    expect(lines[1]).toBe('c1,A001,2026-09-01,true,60,500,0,2026-09-02T08:00:00+02:00,')
  })

  it('truncates the canonical behaviorDate timestamp to a bare YYYY-MM-DD date', () => {
    const checkIn: CheckIn = {
      checkInId: 'c1',
      userId: 'A001',
      behaviorDate: '2026-09-01T00:00:00.000Z',
      weekNo: 1,
      played: false,
      timeMin: 0,
      stakesCzk: 0,
      winningsCzk: 0,
      submittedAt: '2026-09-02T08:00:00+02:00',
      updatedAt: null,
    }
    const csv = toCheckInCsv([checkIn])
    expect(csv).toContain(',2026-09-01,')
    expect(csv).not.toContain('T00:00:00.000Z')
  })
})

describe('toLimitCsv', () => {
  it('emits the stable header and one row per limit', () => {
    const limit: Limit = {
      limitId: 'l1',
      userId: 'A001',
      weekNo: 1,
      weeklyLimitTimeMin: 480,
      weeklyLimitStakesCzk: 8_000,
      limitSetAt: '2026-08-31T21:30:00+02:00',
    }
    const csv = toLimitCsv([limit])
    const lines = csv.trim().split('\r\n')
    expect(lines[0]).toBe(
      'limit_id,user_id,week_no,weekly_limit_time_min,weekly_limit_stakes_czk,limit_set_at',
    )
    expect(lines[1]).toBe('l1,A001,1,480,8000,2026-08-31T21:30:00+02:00')
  })
})

describe('toCopingStrategyCsv', () => {
  it('emits the stable header and one row per coping strategy', () => {
    const strategy: CopingStrategy = {
      copingStrategyId: 'cs1',
      userId: 'A001',
      label: 'Jít na 15 minut ven',
      type: 'default',
      priority: 1,
      active: true,
      createdAt: '2026-08-31T21:30:00+02:00',
      updatedAt: null,
    }
    const csv = toCopingStrategyCsv([strategy])
    const lines = csv.trim().split('\r\n')
    expect(lines[0]).toBe('coping_strategy_id,user_id,label,type,active,created_at,updated_at')
    expect(lines[1]).toBe('cs1,A001,Jít na 15 minut ven,default,true,2026-08-31T21:30:00+02:00,')
  })

  it('quotes a label containing a comma', () => {
    const strategy: CopingStrategy = {
      copingStrategyId: 'cs2',
      userId: 'A001',
      label: 'Zavolat kamarádovi, jít ven',
      type: 'custom',
      priority: 2,
      active: true,
      createdAt: '2026-08-31T21:30:00+02:00',
      updatedAt: null,
    }
    const csv = toCopingStrategyCsv([strategy])
    expect(csv).toContain('"Zavolat kamarádovi, jít ven"')
  })
})
