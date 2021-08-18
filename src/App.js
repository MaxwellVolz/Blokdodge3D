// import { Box, Plane } from "@react-three/drei";
import { useEffect, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, usePlane, useBox } from '@react-three/cannon'
import './App.css'


function Plane(props) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }))
  return (
    <mesh receiveShadow ref={ref}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  )
}

function Cube(props) {
  const [ref] = useBox(() => ({ mass: 1, ...props }))
  return (
    <mesh castShadow ref={ref}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

export default function App() {
  const [ready, set] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => set(true), 1000)
    return () => clearTimeout(timeout)
  }, [])
  return (
    <Canvas dpr={[1, 2]} shadows camera={{ position: [-5, 5, 5], fov: 50 }}>
      <ambientLight />
      <spotLight angle={0.25} penumbra={0.5} position={[0, 20, 0]} castShadow />
      <Physics gravity={[0, -2, 0]}>
        <Plane />
        <Cube position={[3.5, 16, 0]} />
        <Cube position={[0, 20, -0.25]} />
        <Cube position={[-3.5, 25, 0.25]} />
        {ready && <Cube position={[-0.45, 40, 2.25]} />}
        {ready && <Cube position={[-3.45, 42, 0.25]} />}
        {ready && <Cube position={[3.45, 40, -2.25]} />}
      </Physics>
    </Canvas>
  )
}
