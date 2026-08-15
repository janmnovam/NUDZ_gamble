import { type Collection, type Table } from 'dexie'
import type { IndexableValue, Query, Repository } from '@data/db.ts'

/**
 * Generic repository over a single Dexie table — the reusable read/write
 * building block for every adapter. Advanced needs (joins across stores,
 * aggregations) use the public `table` escape hatch with raw Dexie.
 */
export class DexieRepository<T, K extends IndexableValue = string> implements Repository<T, K> {
  readonly table: Table<T, K>

  constructor(table: Table<T, K>) {
    this.table = table
  }

  get(key: K): Promise<T | undefined> {
    return this.table.get(key)
  }

  getAll(): Promise<T[]> {
    return this.table.toArray()
  }

  async query(spec: Query<T> = {}): Promise<T[]> {
    const base: Collection<T, K> = spec.where
      ? this.table.where(spec.where.field).equals(spec.where.equals)
      : this.table.toCollection()
    const collection = spec.filter ? base.filter(spec.filter) : base

    let items = spec.sortBy ? await collection.sortBy(spec.sortBy) : await collection.toArray()
    if (spec.reverse) items = items.reverse()
    if (spec.offset !== undefined) items = items.slice(spec.offset)
    if (spec.limit !== undefined) items = items.slice(0, spec.limit)
    return items
  }

  async count(spec: Pick<Query<T>, 'where' | 'filter'> = {}): Promise<number> {
    if (!spec.where && !spec.filter) return this.table.count()
    return (await this.query(spec)).length
  }

  put(item: T): Promise<K> {
    return this.table.put(item)
  }

  async bulkPut(items: T[]): Promise<void> {
    await this.table.bulkPut(items)
  }

  async remove(key: K): Promise<void> {
    await this.table.delete(key)
  }
}
