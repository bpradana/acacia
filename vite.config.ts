import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: './',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
})
