import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isStatic = process.env.VITE_STATIC === 'true'

export default defineConfig({
  plugins: [react()],
  base: isStatic ? '/Jatak/' : '/',
  resolve: isStatic ? {
    alias: {
      '../api/client': path.resolve(__dirname, 'src/api/client.static.ts'),
    },
  } : {},
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
