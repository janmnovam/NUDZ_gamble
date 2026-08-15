import Dexie from 'dexie'

/**
 * IndexedDB wiring only — no domain schema yet.
 *
 * Add the real stores as a new `version(n).stores({...})` block when the data
 * model lands; the placeholder store exists so the database can be opened and
 * the storage layer smoke-tested.
 */
export class AppDatabase extends Dexie {
  constructor(name = 'nudz-gamble') {
    super(name)
    this.version(1).stores({ _bootstrap: 'id' })
  }
}

export const db = new AppDatabase()
