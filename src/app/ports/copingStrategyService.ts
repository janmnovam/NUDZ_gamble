/**
 * CopingStrategyService — the inbound (driving) port the UI calls for coping
 * strategies. Today it serves the onboarding picker; post-onboarding
 * management (create/toggle/list) can be added here as those screens land.
 */
import type { CopingSuggestionDto } from '@/app/dto/coping.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export interface CopingStrategyService {
  /** The predefined coping suggestions (Dr. Kazmer's list) for the onboarding picker. */
  getSuggestions(userId: UserId, time: ISOTimestamp): Promise<CopingSuggestionDto[]>
}
