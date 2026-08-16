/**
 * Concrete CopingStrategyService. Wraps the outbound `CopingStrategyRepository`
 * and maps its domain results onto the UI-shaped DTOs at the boundary.
 * Validation (`normalizeCopingLabel`) and priority assignment
 * (`nextCopingPriority`) are pure domain helpers — this class stays a thin
 * DTO/repo wrapper. `userId`/`time` are caller-supplied per call (no clock or
 * demo-user default is read here), per `OnboardingServiceImpl`'s pattern.
 */
import type {
  CopingStrategyDto,
  CopingSuggestionDto,
  CreateCopingStrategyRequest,
} from '@/app/dto/coping.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import { toCopingStrategyDto, toCopingSuggestionDto } from '@/app/mappers/copingMapper.ts'
import { type Result, run } from '@/app/result.ts'
import { normalizeCopingLabel, nextCopingPriority } from '@domain/coping.ts'
import { DomainError } from '@domain/errors.ts'
import type { ISOTimestamp, UserId } from '@domain/model.ts'
import type { CopingStrategyRepository } from '@domain/ports.ts'

export interface CopingStrategyServiceDeps {
  repo: CopingStrategyRepository
}

export class CopingStrategyServiceImpl implements CopingStrategyService {
  private readonly deps: CopingStrategyServiceDeps

  constructor(deps: CopingStrategyServiceDeps) {
    this.deps = deps
  }

  getSuggestions(_userId: UserId, _time: ISOTimestamp): Promise<Result<CopingSuggestionDto[]>> {
    return run(async () => {
      const defaults = await this.deps.repo.loadDefaults()
      return defaults.map(toCopingSuggestionDto)
    })
  }

  list(userId: UserId, _time: ISOTimestamp): Promise<Result<CopingStrategyDto[]>> {
    return run(async () => {
      const strategies = await this.deps.repo.listByUser(userId)
      return strategies.map(toCopingStrategyDto)
    })
  }

  create(
    req: CreateCopingStrategyRequest,
    userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<CopingStrategyDto>> {
    return run(async () => {
      const label = normalizeCopingLabel(req.label)
      const existing = await this.deps.repo.listByUser(userId)
      const created = await this.deps.repo.create(
        {
          userId,
          label,
          type: 'custom',
          priority: nextCopingPriority(existing),
        },
        time,
      )
      return toCopingStrategyDto(created)
    })
  }

  toggle(
    copingStrategyId: string,
    active: boolean,
    _userId: UserId,
    time: ISOTimestamp,
  ): Promise<Result<void>> {
    return run(async () => {
      if (copingStrategyId.trim().length === 0) {
        throw new DomainError(
          'validation',
          'COPING_EMPTY_ID',
          'coping: copingStrategyId must not be empty',
        )
      }
      await this.deps.repo.setActive(copingStrategyId, active, time)
    })
  }
}
