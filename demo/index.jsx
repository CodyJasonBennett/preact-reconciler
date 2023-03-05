import { render } from 'preact'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

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
