import * as path from 'node:path'
import { defineConfig, transformWithEsbuild } from 'vite'

const entries = ['./src/index.ts', './src/constants.ts', './src/reflection.ts']

export default defineConfig({
  build: {
    target: 'es2018',
    lib: {
      formats: ['es', 'cjs'],
      entry: entries[0],
      fileName: '[name]',
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !path.isAbsolute(id),
      input: entries,
      output: {
        preserveModules: true,
      },
    },
  },
  plugins: [
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
