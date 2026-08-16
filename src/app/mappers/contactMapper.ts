import type { ContactDto } from '@/app/dto/contact.ts'
import type { Contact } from '@domain/model.ts'

export function toContactDto(contact: Contact): ContactDto {
  return {
    id: contact.contactId,
    name: contact.name,
    purpose: contact.purpose,
    phone: contact.phone,
    url: contact.url,
    availability: contact.availability,
    category: contact.category,
    priority: contact.priority,
  }
}
