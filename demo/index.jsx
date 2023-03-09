import { render } from 'preact'
import { useState, useEffect } from 'react'
import { usePlane, useBox, Physics } from '@react-three/cannon'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

function Plane(props) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }))
  return (
    <mesh ref={ref} receiveShadow scale={1000}>
      <planeGeometry />
      <meshPhongMaterial color="#f0f0f0" />
    </mesh>
  )
}

function Cube(props) {
  const [ref] = useBox(() => ({ mass: 1, ...props }))
  return (
    <mesh ref={ref} castShadow>
      <boxGeometry />
      <meshPhongMaterial color="orange" />
    </mesh>
  )
}

function App() {
  const [ready, set] = useState(false)
  useEffect(() => void setTimeout(() => set(true), 1000), [])
  return (
    <Canvas shadows camera={{ fov: 50, position: [-5, 5, 5] }}>
      <ambientLight />
      <spotLight castShadow angle={0.25} penumbra={0.5} position={[10, 10, 5]} />
      <OrbitControls />
      <Physics>
        <Plane />
        <Cube position={[0, 5, 0]} />
        <Cube position={[0.45, 7, -0.25]} />
        <Cube position={[-0.45, 9, 0.25]} />
        {ready && <Cube position={[-0.45, 10, 0.25]} />}
      </Physics>
    </Canvas>
  )
}

render(<App />, root)
