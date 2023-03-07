import * as path from 'node:path'
import * as vite from 'vite'
import preact from '@preact/preset-vite'

const entries = ['./src/index.ts', './src/constants.ts', './src/reflection.ts']

export default vite.defineConfig({
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
    process.argv[2]
      ? {
          name: 'vite-minify',
          renderChunk: {
            order: 'post',
            async handler(code, { fileName }) {
              return vite.transformWithEsbuild(code, fileName, {
                minify: true,
                mangleProps: /^(__type|fiber|container|containerInfo|hostConfig)$/,
                mangleQuoted: true,
              })
            },
          },
        }
      : preact(),
  ],
})
