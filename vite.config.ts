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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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
