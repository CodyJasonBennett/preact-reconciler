import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

ReactDOM.createRoot(root).render(
  <Canvas>
    <OrbitControls />
    <mesh>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  </Canvas>,
)
