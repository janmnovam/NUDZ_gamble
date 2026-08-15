import { type Profile, type UserId } from '@/core/model'
import { type ProfilePort, type Repository } from '@/core/ports'

import { type AppDatabase } from '../db'
import { DexieRepository } from '../repository'

/** Writes and reads the single per-user profile row. */
export class ProfileAdapter implements ProfilePort {
  private readonly repo: Repository<Profile>

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
