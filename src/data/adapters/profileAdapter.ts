import { type ProfileEntity } from '@data/model.ts'
import { type ProfileRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'
import type { Profile, UserId } from '@domain/model.ts'

/** Writes and reads the single per-user profile row. */
export class ProfileAdapter implements ProfileRepository {
  private readonly repo: Repository<ProfileEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.profile)
  }

  async save(profile: Profile): Promise<void> {
    await this.repo.put(profile)
  }

  get(userId: UserId): Promise<Profile | undefined> {
    return this.repo.get(userId)
  }
}
