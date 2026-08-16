import { useCallback, useRef, useState } from 'react'

import { DEMO_USER_ID } from '@/app/constants.ts'
import { useExportService } from '@ui/app/AppContext.ts'
import { clientNow } from '@ui/clock.ts'
import { downloadBytes, exportFilename } from '@ui/lib/download.ts'

export type ExportStatus = 'idle' | 'running' | 'failed'

/**
 * Runs the CSV/ZIP export and hands the archive to the browser.
 *
 * The whole bundle is built in memory before anything is offered to the user,
 * so a failure mid-way leaves no half-written file — the download only starts
 * once `exportDataZip` has resolved.
 */
export function useExportDownload() {
  const exportService = useExportService()
  const [status, setStatus] = useState<ExportStatus>('idle')
  // Guards against a double tap producing two archives; `status` can't do this
  // on its own because state updates are not synchronous.
  const running = useRef(false)

  const exportData = useCallback(() => {
    if (running.current) return
    running.current = true
    setStatus('running')

    void exportService.exportDataZip(DEMO_USER_ID, clientNow()).then((res) => {
      if (res.error || !res.data) {
        console.error('[export] exportDataZip failed', res.error)
        running.current = false
        setStatus('failed')
        return
      }
      downloadBytes(res.data, exportFilename(new Date()), 'application/zip')
      running.current = false
      setStatus('idle')
    })
  }, [exportService])

  return { exportData, status }
}
