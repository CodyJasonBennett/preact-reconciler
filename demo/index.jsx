import { render } from 'preact'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// This is the same as ReactDOM.createRoot(root).render(...)
render(
  <Canvas>
    <OrbitControls />
    <mesh>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  </Canvas>,
  root,
)
