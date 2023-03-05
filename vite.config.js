import * as path from 'node:path'
import { defineConfig, transformWithEsbuild } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  root: process.argv[2] ? undefined : 'demo',
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-reconciler': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['react-reconciler'],
  },
  build: {
    lib: {
      formats: ['es', 'cjs'],
      entry: 'src/index.js',
      fileName: '[name]',
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !path.isAbsolute(id),
    },
  },
  plugins: [
    preact(),
    {
      name: 'vite-minify',
      renderChunk: {
        order: 'post',
        async handler(code, { fileName }) {
          return transformWithEsbuild(code, fileName, {
            minify: true,
            mangleProps: /^__/,
            mangleQuoted: true,
          })
        },
      },
    },
  ],
})
