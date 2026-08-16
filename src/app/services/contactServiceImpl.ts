import { toContactDto } from '@/app/mappers/contactMapper.ts'
import type { ContactService } from '@/app/ports/contactService.ts'
import type { ContactDto } from '@/app/dto/contact.ts'
import type { ContactRepository } from '@domain/ports.ts'

interface ContactServiceDeps {
  repo: ContactRepository
}

/** Seeds the bundled directory idempotently, then exposes it read-only to the UI. */
export class ContactServiceImpl implements ContactService {
  private readonly deps: ContactServiceDeps

  constructor(deps: ContactServiceDeps) {
    this.deps = deps
  }

  async list(): Promise<ContactDto[]> {
    await this.deps.repo.seed()
    const contacts = await this.deps.repo.list()
    return contacts.map(toContactDto)
  }
}
