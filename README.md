[![Size](https://img.shields.io/bundlephobia/minzip/preact-reconciler?label=gzip&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/package/preact-reconciler)
[![Version](https://img.shields.io/npm/v/preact-reconciler?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/preact-reconciler)
[![Downloads](https://img.shields.io/npm/dt/preact-reconciler.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/preact-reconciler)

# preact-reconciler

Custom renderers for Preact in <1KB.

This package implements [`react-reconciler`](https://npmjs.com/react-reconciler) which allows for custom renderers to be implemented and shared between Preact and React such as [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber#readme).

## Installation

To get started, you'll only need `preact` and `preact-reconciler`. No need to install `react` or `react-dom`.

```bash
npm install preact preact-reconciler
yarn add preact preact-reconciler
pnpm add preact preact-reconciler
```

With your choice of tooling, alias `react`, `react-dom`, and its dependencies.

```js
const resolve = {
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react-reconciler': 'preact-reconciler',
  },
}

// vite.config.js
export default { resolve }

// webpack.config.js
module.exports = { resolve }

// next.config.js (webpackFinal for .storybook/main.js)
module.exports = {
  webpack(config) {
    Object.assign(config.resolve.alias, resolve.alias)
    return config
  },
}
```
