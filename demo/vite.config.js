import * as path from 'node:path'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-reconciler': path.resolve(__dirname, '../src'),
    },
  },
  optimizeDeps: {
    exclude: ['react-reconciler'],
  },
  plugins: [preact()],
})
