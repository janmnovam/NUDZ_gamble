import { readFileSync } from 'node:fs'

import { expect, type Locator, type Page } from '@playwright/test'

import { parseCsv, readStoredZip, type ParsedCsv } from '../support/zip'

/**
 * The reports tab (final summary), reached via the bottom TabBar. Its main job
 * for tests is the CSV/ZIP export: it triggers the download, captures it, and
 * unpacks the archive into parsed CSVs so specs can assert the raw-table shape.
 */
export class ReportsPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get exportButton(): Locator {
    return this.page.getByRole('button', { name: 'Exportovat data' })
  }

  /** The final-summary title ("Přehledy"). */
  get title(): Locator {
    return this.page.getByRole('heading', { name: 'Přehledy' })
  }

  /** Locked (not-yet-reached) week rows carry a lock with this label. */
  get lockedWeeks(): Locator {
    return this.page.getByRole('img', { name: 'Zatím nedostupné' })
  }

  /** A reached week's card (button); locked weeks are plain, non-interactive rows. */
  weekCard(weekNo: number): Locator {
    return this.page.getByRole('button', { name: new RegExp(`Týden ${String(weekNo)}`) })
  }

  /** Open the reports tab from the bottom navigation. */
  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Přehledy' }).click()
    await expect(this.exportButton).toBeVisible()
  }

  /** Open the programme (month-grid) overview from the summary list. */
  async openProgramme(): Promise<void> {
    await this.page.getByRole('button', { name: 'Souhrnný přehled' }).click()
  }

  /**
   * Trigger the export, capture the download, and return the archive: its
   * filename, the entry names, and each CSV parsed. Uses a portable stored-ZIP
   * reader — no external unzip.
   */
  async downloadExport(): Promise<{
    filename: string
    names: string[]
    csv: (name: string) => ParsedCsv
  }> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportButton.click(),
    ])
    const path = await download.path()
    const files = readStoredZip(readFileSync(path))
    return {
      filename: download.suggestedFilename(),
      names: [...files.keys()],
      csv: (name: string) => parseCsv(files.get(name) ?? ''),
    }
  }
}
