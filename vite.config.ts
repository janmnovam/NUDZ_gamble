import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.BASE_PATH ?? '/'

export default defineConfig(({ command }) => {
  // Locally-trusted HTTPS (mkcert) for the dev server only. It gives us two things
  // over the LAN: `crypto.randomUUID` (needs a secure context) works when testing on
  // a phone, and — because the cert is *trusted*, not just self-signed — the service
  // worker actually registers (browsers refuse SW registration over a cert error, so
  // an untrusted cert is not enough). Excluded from `vite preview` so the e2e server
  // stays plain HTTP. Note: the phone must trust mkcert's root CA (install rootCA.pem
  // from `mkcert -CAROOT`); desktop trusts it automatically once mkcert installs it.
  const httpsInDev = command === 'serve' && !process.argv.includes('preview')

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      ...(httpsInDev ? [mkcert()] : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'NUDZ Gamble — sebekontrola nad hazardním hraním',
          short_name: 'Sebekontrola',
          description:
            'Aplikace pro sebekontrolu nad hazardním hraním: referenční týden, limity, denní check-in a týdenní review.',
          lang: 'cs',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          // No service worker under `npm run dev`: it would precache the app
          // shell and (especially on iOS) serve it stale, masking code changes
          // and breaking HMR. This flag only affects the dev server — `vite
          // preview` and production builds always ship the real SW, so verify
          // install/offline behaviour there.
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
        '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
        '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      },
    },
    server: {
      // Needed to open the app from a phone on the same network.
      host: true,
    },
  }
})
