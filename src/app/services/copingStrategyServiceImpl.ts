/**
 * Concrete CopingStrategyService. Wraps the outbound `CopingStrategyRepository`
 * and maps its domain results onto the UI-shaped DTOs at the boundary.
 */
import type { CopingSuggestionDto } from '@/app/dto/coping.ts'
import type { CopingStrategyService } from '@/app/ports/copingStrategyService.ts'
import { toCopingSuggestionDto } from '@/app/mappers/copingMapper.ts'
import type { CopingStrategyRepository } from '@domain/ports.ts'

export interface CopingStrategyServiceDeps {
  repo: CopingStrategyRepository
}

export class CopingStrategyServiceImpl implements CopingStrategyService {
  private readonly deps: CopingStrategyServiceDeps

  constructor(deps: CopingStrategyServiceDeps) {
    this.deps = deps
  }

  async getSuggestions(): Promise<CopingSuggestionDto[]> {
    const defaults = await this.deps.repo.loadDefaults()
    return defaults.map(toCopingSuggestionDto)
  }
}
