/**
 * The UI's single wired application instance — the inbound services the
 * components call. Built once against the real (IndexedDB) data layer; import
 * `app` wherever a component needs a use-case.
 */
import { createApp, type App } from '@/core'

export const app: App = createApp()
