/**
 * CopingStrategyService — the inbound (driving) port the UI calls for coping
 * strategies. Serves the onboarding picker (`getSuggestions`) and
 * post-onboarding management (`list`/`create`/`toggle`) as those screens land.
 */
import type {
  CopingStrategyDto,
  CopingSuggestionDto,
  CreateCopingStrategyRequest,
  UpdateCopingStrategyRequest,
} from '@/app/dto/coping.ts'
import type { Result } from '@/app/result.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'

export interface CopingStrategyService {
  /**
   * The predefined coping suggestions (Dr. Kazmer's list) for the onboarding
   * picker. User-agnostic — the list is global, and onboarding has no user yet.
   */
  getSuggestions(time: ISOTimestamp): Promise<Result<CopingSuggestionDto[]>>

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

  /**
   * Edit a custom strategy's label and/or optional detail fields. Rejects an
   * empty id, an unknown id, and an attempt to edit a non-custom (catalog)
   * strategy. `time` is the caller-supplied instant that stamps `updatedAt`.
   */
  update(
    copingStrategyId: string,
    req: UpdateCopingStrategyRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<CopingStrategyDto>>

  /**
   * Permanently delete a custom strategy. Rejects an empty id, an unknown id,
   * and an attempt to delete a non-custom (catalog) strategy — those can
   * never be deleted. No `time` is taken: nothing on a delete is stamped.
   */
  remove(copingStrategyId: string, userId: UserId): Promise<Result<void>>
}
