import { type ContactEntity } from '@data/model.ts'
import type { Contact } from '@domain/model.ts'
import { type ContactRepository } from '@domain/ports.ts'

import { type AppDatabase, type Repository } from '../db'
import { DexieRepository } from '../repository'
import { CONTACTS } from '../seeds/contacts'

export class ContactAdapter implements ContactRepository {
  private readonly repo: Repository<ContactEntity>

  constructor(db: AppDatabase) {
    this.repo = new DexieRepository(db.contacts)
  }

  async seed(): Promise<void> {
    await this.repo.bulkPut([...CONTACTS])
  }

  list(): Promise<Contact[]> {
    return this.repo.query({ sortBy: 'priority' })
  }

  get(contactId: string): Promise<Contact | undefined> {
    return this.repo.get(contactId)
  }
}
