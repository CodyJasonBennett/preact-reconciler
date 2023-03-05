import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import * as THREE from 'three'
import { createRoot, extend } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Canvas({ children, ...props }) {
  const [canvas, setCanvas] = React.useState()
  const root = React.useMemo(() => canvas && createRoot(canvas), [canvas])
  React.useEffect(() => () => root?.unmount(), [root])

  extend(THREE)
  root?.render(children, props)

  return <canvas ref={setCanvas} />
}

ReactDOM.createRoot(root).render(
  <Canvas>
    <OrbitControls />
    <mesh>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  </Canvas>,
)
