import * as path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: process.argv[2] ? undefined : 'demo',
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      scheduler: path.resolve(__dirname, './src/scheduler'),
      'react-reconciler': path.resolve(__dirname, './src'),
    },
  },
})
