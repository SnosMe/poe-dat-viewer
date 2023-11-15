import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  // development only
  optimizeDeps: {
    exclude: ['pathofexile-dat', 'ooz-wasm']
  },
  // development only
  server: {
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.GITHUB_SHA || 'dev')
  }
})
