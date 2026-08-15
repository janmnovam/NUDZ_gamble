import { type ContactEntity } from '@data/model.ts'
import { contactToDomain } from '@data/mappers.ts'
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

  async list(): Promise<Contact[]> {
    const rows = await this.repo.query({ sortBy: 'priority' })
    return rows.map(contactToDomain)
  }

  async get(contactId: string): Promise<Contact | undefined> {
    const entity = await this.repo.get(contactId)
    return entity && contactToDomain(entity)
  }
}
