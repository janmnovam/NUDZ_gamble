import { Download, Share, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@ui/components/Button.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

/** Only shown once — the first time the app is opened in an installable browser. */
const SEEN_KEY = 'nudz.installPromptSeen'
/** Small delay so the prompt doesn't slam the screen the instant the app loads. */
const IOS_DELAY_MS = 1500

/** The non-standard event Chromium fires when the app is installable. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isInstalled(): boolean {
  if (typeof window === 'undefined') return false
  const standaloneDisplay = window.matchMedia('(display-mode: standalone)').matches
  // iOS Safari exposes its own non-standard flag instead of display-mode.
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return standaloneDisplay || iosStandalone
}

function isPhone(): boolean {
  // Phone-only: Android Chrome tags phone UAs with "Mobile" (tablets omit it),
  // plus iPhone/iPod. Desktop and most tablets are deliberately excluded.
  return /android.*mobile|iphone|ipod|mobile safari/i.test(navigator.userAgent)
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  // Exclude Chrome/Firefox/Edge on iOS (they can't add to the home screen).
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
  return isIos && isSafari
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Non-fatal: worst case the prompt shows again next launch.
  }
}

/**
 * First-run "install this app" prompt. On Chromium it captures the native
 * `beforeinstallprompt` and offers an Install button that triggers it; on iOS
 * Safari — which has no such event — it shows the manual Add-to-Home-Screen
 * steps. Skipped when the app already runs installed, and only ever shown once.
 */
export function InstallPrompt() {
  const { t } = useTranslation()
  const [variant, setVariant] = useState<'hidden' | 'prompt' | 'ios'>('hidden')
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    let seen: boolean
    try {
      seen = localStorage.getItem(SEEN_KEY) !== null
    } catch {
      seen = false
    }
    if (seen || isInstalled()) return
    // Install prompt is phone-only — desktop users are not nudged.
    if (!isPhone()) return

    const onBeforeInstall = (event: Event) => {
      event.preventDefault() // stop Chrome's mini-infobar; we drive it ourselves
      deferredRef.current = event as BeforeInstallPromptEvent
      setVariant('prompt')
      markSeen()
    }
    const onInstalled = () => {
      setVariant('hidden')
      markSeen()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // iOS Safari never fires `beforeinstallprompt`, so offer manual steps.
    let iosTimer: number | undefined
    if (isIosSafari()) {
      iosTimer = window.setTimeout(() => {
        // A beforeinstallprompt may have shown (and marked seen) already —
        // don't clobber it with the iOS variant.
        try {
          if (localStorage.getItem(SEEN_KEY) !== null) return
        } catch {
          // fall through and show
        }
        setVariant('ios')
        markSeen()
      }, IOS_DELAY_MS)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      if (iosTimer !== undefined) window.clearTimeout(iosTimer)
    }
  }, [])

  const dismiss = () => {
    setVariant('hidden')
  }

  const install = () => {
    const deferred = deferredRef.current
    if (!deferred) {
      dismiss()
      return
    }
    void deferred.prompt().then(() =>
      deferred.userChoice.finally(() => {
        deferredRef.current = null
        setVariant('hidden')
      }),
    )
  }

  if (variant === 'hidden') return null
  const isIos = variant === 'ios'

  return createPortal(
    <div
      className="bg-ink/40 fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('install.title')}
      onClick={dismiss}
    >
      <div
        className="bg-surface flex w-full max-w-sm flex-col gap-4 rounded-md p-5 shadow-xl"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="type-h2 text-ink">{t('install.title')}</h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('install.close')}
            className="text-muted hover:text-ink focus-visible:ring-brand -m-1 rounded-full p-1 focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <p className="text-muted text-sm leading-5">
          {isIos ? t('install.ios.body') : t('install.body')}
        </p>

        {isIos ? (
          <p className="text-muted inline-flex items-center gap-1.5 text-sm leading-5">
            <Share className="text-brand size-4 shrink-0" aria-hidden />
            {t('install.ios.step')}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {isIos ? (
            <Button size="md" fullWidth onClick={dismiss}>
              {t('install.ios.cta')}
            </Button>
          ) : (
            <Button size="md" fullWidth onClick={install}>
              <Download className="size-4" aria-hidden />
              {t('install.cta')}
            </Button>
          )}
          {!isIos ? (
            <Button size="md" fullWidth variant="ghost" onClick={dismiss}>
              {t('install.later')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
