import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

import type { ExportService } from '@/app/ports/exportService.ts'
import { fail, ok, type Result } from '@/app/result.ts'
import type { App } from '@/core/index.ts'
import { AppProvider } from '@ui/app/AppProvider.tsx'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { useExportDownload } from '@ui/export/useExportDownload.ts'

function Harness() {
  const { exportData, status } = useExportDownload()
  return (
    <div>
      <button type="button" onClick={exportData}>
        export
      </button>
      <span data-testid="status">{status}</span>
    </div>
  )
}

/** Only the export seam matters, so a narrowed cast keeps the fake focused. */
function renderHarness(exportService: ExportService) {
  useCurrentUser.setState({ userId: 'test-user' })
  render(
    <AppProvider app={{ export: exportService } as App}>
      <Harness />
    </AppProvider>,
  )
  return screen.getByRole('button', { name: 'export' })
}

describe('useExportDownload', () => {
  let clicked: HTMLAnchorElement[]

  beforeEach(() => {
    clicked = []
    // jsdom implements neither of these; record what the helper would hand over.
    URL.createObjectURL = jest.fn(() => 'blob:fake')
    URL.revokeObjectURL = jest.fn()
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this)
    })
  })

  it('offers the archive as a dated .zip download', async () => {
    const button = renderHarness({
      exportDataZip: () => Promise.resolve(ok(new Uint8Array([1, 2, 3]))),
    })
    fireEvent.click(button)

    await waitFor(() => {
      expect(clicked).toHaveLength(1)
    })
    expect(clicked[0]?.download).toMatch(/^nudz-export-\d{4}-\d{2}-\d{2}\.zip$/)
  })

  it('ignores a second tap while an export is already running', async () => {
    let resolve: ((result: Result<Uint8Array>) => void) | undefined
    const button = renderHarness({
      exportDataZip: () =>
        new Promise<Result<Uint8Array>>((r) => {
          resolve = r
        }),
    })

    fireEvent.click(button)
    fireEvent.click(button)
    resolve?.(ok(new Uint8Array([1])))

    await waitFor(() => {
      expect(clicked).toHaveLength(1)
    })
  })

  it('reports a failure instead of offering a broken file', async () => {
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const button = renderHarness({
      exportDataZip: () =>
        Promise.resolve(fail({ type: 'internal', code: 'INTERNAL', trace: 'test' })),
    })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('failed')
    })
    expect(clicked).toHaveLength(0)
    logged.mockRestore()
  })
})
