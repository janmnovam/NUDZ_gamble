import { type AppDatabase } from '@data/db.ts'
import { copingToEntity, limitToEntity, profileToEntity } from '@data/mappers.ts'
import { type CopingStrategy, type Limit, type Profile } from '@domain/model.ts'
import { type OnboardingRepository } from '@domain/ports.ts'

/**
 * Persists an onboarding result atomically: profile + week-1 limit + ≥1 coping
 * in one read/write transaction. `limits.add` (not `put`) makes the append-only
 * guarantee real — the `&[user_id+week_no]` unique index throws on a duplicate
 * week, aborting the whole transaction so nothing is half-written.
 */
export class OnboardingAdapter implements OnboardingRepository {
  private readonly db: AppDatabase

  constructor(db: AppDatabase) {
    this.db = db
  }

  async save(profile: Profile, limit: Limit, coping: CopingStrategy[]): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.profile,
      this.db.limits,
      this.db.coping_strategy,
      async () => {
        await this.db.profile.put(profileToEntity(profile))
        await this.db.limits.add(limitToEntity(limit))
        await this.db.coping_strategy.bulkAdd(coping.map(copingToEntity))
      },
    )
  }
}
