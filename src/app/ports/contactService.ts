import type { ContactDto } from '@/app/dto/contact.ts'

/** Read-only directory of built-in support contacts. */
export interface ContactService {
  list(): Promise<ContactDto[]>
}
