/**
 * CopingStrategyService — the inbound (driving) port the UI calls for coping
 * strategies. Serves the onboarding picker (`getSuggestions`) and
 * post-onboarding management (`list`/`create`/`toggle`) as those screens land.
 */
import type {
  CopingStrategyDto,
  CopingSuggestionDto,
  CreateCopingStrategyRequest,
} from '@/app/dto/coping.ts'
import type { Result } from '@/app/result.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export interface CopingStrategyService {
  /** The predefined coping suggestions (Dr. Kazmer's list) for the onboarding picker. */
  getSuggestions(userId: UserId, time: ISOTimestamp): Promise<Result<CopingSuggestionDto[]>>

  /** The user's own coping strategies (default + custom), by priority. */
  list(userId: UserId, time: ISOTimestamp): Promise<Result<CopingStrategyDto[]>>

  /**
   * Add a custom coping strategy, appended after all existing ones.
   * Rejects an empty/whitespace-only label. `time` is the caller-supplied
   * instant that stamps `createdAt`.
   */
  create(
    req: CreateCopingStrategyRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<CopingStrategyDto>>

  /**
   * Toggle a strategy active/inactive. Rejects an unknown id. `time` is the
   * caller-supplied instant that stamps `updatedAt`.
   */
  toggle(
    copingStrategyId: string,
    active: boolean,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<void>>
}
