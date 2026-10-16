import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Firestore imports an RE2 regex engine (~140 KB, ~45 KB gzipped) only for its "pipeline" query
      // expressions (regexMatch/regexContains). The site uses classic queries, so ship a stub instead.
      re2js: fileURLToPath(new URL('./src/lib/re2js-stub.js', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks: they are downloaded in parallel and stay cached across app-code deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/node_modules[\\/](@firebase|firebase|idb)[\\/]/.test(id)) return 'firebase'
          return undefined
        },
      },
    },
  },
})
