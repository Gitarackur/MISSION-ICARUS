import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const sharedAliases = {
  '@': path.resolve(__dirname, 'src'),
  'main@': path.resolve(__dirname),
  'pub@': path.resolve(__dirname, 'public'),
}

// Content Security Policy for production builds. The renderer loads bundled
// scripts and workers from disk, renders plots as data/blob image URLs, and
// styles components through inline style attributes; nothing else is needed.
// Injected only on `build` so the dev server keeps HMR and inline preamble.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const injectCspMeta = () => ({
  name: 'inject-csp-meta',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    return html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP_DIRECTIVES}" />`
    )
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    injectCspMeta(),
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          resolve: {
            alias: sharedAliases,
          },
          build: {
            rollupOptions: {
              external: [
                'better-sqlite3',
                'bindings',
                'node:*',
              ],
              output: {
                format: 'es',
              }
            },
            // Important: Don't minify in development to preserve __filename/__dirname
            minify: process.env.NODE_ENV === 'production',
          }
        }
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          resolve: {
            alias: sharedAliases,
          },
          build: {
            rollupOptions: {
              output: {
                format: 'cjs', // Preload often works better with CommonJS
              }
            }
          }
        }
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
  resolve: {
    alias: sharedAliases,
  },
})
