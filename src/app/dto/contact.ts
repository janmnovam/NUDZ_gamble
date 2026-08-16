import type { ContactCategory } from '@domain/model.ts'

/** Read-only contact row exposed to the UI. */
export interface ContactDto {
  id: string
  name: string
  purpose: string | null
  phone: string | null
  url: string | null
  availability: string | null
  category: ContactCategory
  priority: number
}
