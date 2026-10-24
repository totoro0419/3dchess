import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { PieceSymbol } from 'chess.js'

export function PieceModel({ type, colorKey }: { type: PieceSymbol; colorKey: 'w' | 'b' }) {
  const palette = useMemo(() => createPalette(colorKey), [colorKey])
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.body, roughness: 0.28, metalness: 0.2,
    emissive: palette.emissive, emissiveIntensity: 0.08,
  }), [palette.body, palette.emissive])
  const detailMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.detail, roughness: 0.22, metalness: 0.32,
  }), [palette.detail])
  const crownMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.crown, roughness: 0.18, metalness: 0.45,
    emissive: palette.emissive, emissiveIntensity: 0.05,
  }), [palette.crown, palette.emissive])

  useEffect(() => () => {
    bodyMaterial.dispose(); detailMaterial.dispose(); crownMaterial.dispose()
  }, [bodyMaterial, detailMaterial, crownMaterial])

  return (
    <group>
      <Pedestal bodyMaterial={bodyMaterial} detailMaterial={detailMaterial} />
      <CentralColumn type={type} bodyMaterial={bodyMaterial} detailMaterial={detailMaterial} />
      <Head type={type} bodyMaterial={bodyMaterial} detailMaterial={detailMaterial} crownMaterial={crownMaterial} />
    </group>
  )
}

function createPalette(colorKey: 'w' | 'b') {
  return colorKey === 'w'
    ? { body: '#f4efe6', detail: '#c8ab72', crown: '#f0d18a', emissive: '#7d5b1b' }
    : { body: '#2a2f37', detail: '#76a6d7', crown: '#9cc6f3', emissive: '#284a73' }
}

function Pedestal({bodyMaterial, detailMaterial}:{bodyMaterial:THREE.MeshStandardMaterial;detailMaterial:THREE.MeshStandardMaterial}) {
  return <group>
    <mesh castShadow position={[0,0.075,0]} material={detailMaterial}><cylinderGeometry args={[0.37,0.42,0.09,40]} /></mesh>
    <mesh castShadow position={[0,0.14,0]} material={bodyMaterial}><cylinderGeometry args={[0.31,0.37,0.06,40]} /></mesh>
    <mesh castShadow position={[0,0.195,0]} material={detailMaterial}><torusGeometry args={[0.275,0.032,14,42]} /></mesh>
  </group>
}

function CentralColumn({type,bodyMaterial,detailMaterial}:{type:PieceSymbol;bodyMaterial:THREE.MeshStandardMaterial;detailMaterial:THREE.MeshStandardMaterial}) {
  const height = type==='p'?0.25:type==='n'?0.29:type==='b'?0.33:type==='r'?0.35:type==='q'?0.4:0.43
  return <group>
    <mesh castShadow position={[0,0.25,0]} material={bodyMaterial}><cylinderGeometry args={[0.18,0.25,height,36]} /></mesh>
    <mesh castShadow position={[0,0.355+height*0.18,0]} material={detailMaterial}><torusGeometry args={[0.17,0.024,12,36]} /></mesh>
  </group>
}

function Head({type,bodyMaterial,detailMaterial,crownMaterial}:{type:PieceSymbol;bodyMaterial:THREE.MeshStandardMaterial;detailMaterial:THREE.MeshStandardMaterial;crownMaterial:THREE.MeshStandardMaterial}) {
  if(type==='p') return <Pawn bodyMaterial={bodyMaterial} detailMaterial={detailMaterial}/>
  if(type==='n') return <Knight bodyMaterial={bodyMaterial} detailMaterial={detailMaterial}/>
  if(type==='b') return <Bishop bodyMaterial={bodyMaterial} detailMaterial={detailMaterial}/>
  if(type==='r') return <Rook bodyMaterial={bodyMaterial} detailMaterial={detailMaterial}/>
  if(type==='q') return <Queen bodyMaterial={bodyMaterial} crownMaterial={crownMaterial}/>
  return <King bodyMaterial={bodyMaterial} crownMaterial={crownMaterial}/>
}

function Pawn({bodyMaterial,detailMaterial}:{bodyMaterial:THREE.MeshStandardMaterial;detailMaterial:THREE.MeshStandardMaterial}) {
  return <group>
    <mesh castShadow position={[0,0.45,0]} material={detailMaterial}><torusGeometry args={[0.13,0.026,12,32]} /></mesh>
    <mesh castShadow position={[0,0.58,0]} material={bodyMaterial}><sphereGeometry args={[0.17,26,22]} /></mesh>
  </group>
}

function Knight({bodyMaterial,detailMaterial}:{bodyMaterial:THREE.MeshStandardMaterial;detailMaterial:THREE.MeshStandardMaterial}) {
  return <group position={[0,0.43,0.02]}>
    <mesh castShadow position={[0,-0.02,-0.015]} material={detailMaterial}><cylinderGeometry args={[0.15,0.17,0.08,24]} /></mesh>
    <mesh castShadow position={[0.02,0.15,0]} rotation={[0.05,0,-0.2]} material={bodyMaterial}><boxGeometry args={[0.24,0.42,0.16]} /></mesh>
    <mesh castShadow position={[0.09,0.33,0]} rotation={[0,0,-0.72]} material={bodyMaterial}><boxGeometry args={[0.18,0.26,0.16]} /></mesh>
    <mesh castShadow position={[-0.035,0.3,0]} rotation={[0,0,0.24]} material={bodyMaterial}><boxGeometry args={[0.07,0.18,0.1]} /></mesh>
    <mesh castShadow position={[0.08,0.42,0]} material={detailMaterial}><boxGeometry args={[0.03,0.06,0.18]} /></mesh>
  </group>
}

function Bishop({bodyMaterial,detailMaterial}:{bodyMaterial:THREE.MeshStandardMaterial;detailMaterial:THREE.MeshStandardMaterial}) {
  return <group>
    <mesh castShadow position={[0,0.59,0]} material={bodyMaterial}><sphereGeometry args={[0.155,24,22]} /></mesh>
    <mesh castShadow position={[0,0.72,0]} material={bodyMaterial}><coneGeometry args={[0.13,0.26,30]} /></mesh>
    <mesh castShadow position={[0.047,0.68,0]} rotation={[0,0,-0.55]} material={detailMaterial}><boxGeometry args={[0.032,0.16,0.16]} /></mesh>
    <mesh castShadow position={[0,0.84,0]} material={detailMaterial}><sphereGeometry args={[0.055,16,14]} /></mesh>
  </group>
}

function Rook({bodyMaterial,detailMaterial}:{bodyMaterial:THREE.MeshStandardMaterial;detailMaterial:THREE.MeshStandardMaterial}) {
  return <group>
    <mesh castShadow position={[0,0.6,0]} material={bodyMaterial}><cylinderGeometry args={[0.19,0.21,0.34,28]} /></mesh>
    <mesh castShadow position={[0,0.82,0]} material={detailMaterial}><cylinderGeometry args={[0.25,0.22,0.1,8]} /></mesh>
    {Array.from({length:4},(_,i)=>{const a=i*Math.PI/2;return <mesh key={a} castShadow position={[Math.cos(a)*0.16,0.89,Math.sin(a)*0.16]} material={bodyMaterial}><boxGeometry args={[0.08,0.09,0.08]} /></mesh>})}
  </group>
}

function Queen({bodyMaterial,crownMaterial}:{bodyMaterial:THREE.MeshStandardMaterial;crownMaterial:THREE.MeshStandardMaterial}) {
  return <group>
    <mesh castShadow position={[0,0.63,0]} material={bodyMaterial}><cylinderGeometry args={[0.17,0.22,0.42,32]} /></mesh>
    <mesh castShadow position={[0,0.9,0]} material={crownMaterial}><torusGeometry args={[0.16,0.025,12,40]} /></mesh>
    {Array.from({length:5},(_,i)=>{const a=i/5*Math.PI*2;return <mesh key={a} castShadow position={[Math.cos(a)*0.12,0.97,Math.sin(a)*0.12]} material={crownMaterial}><sphereGeometry args={[0.04,14,12]} /></mesh>})}
    <mesh castShadow position={[0,1.02,0]} material={crownMaterial}><sphereGeometry args={[0.05,14,12]} /></mesh>
  </group>
}

function King({bodyMaterial,crownMaterial}:{bodyMaterial:THREE.MeshStandardMaterial;crownMaterial:THREE.MeshStandardMaterial}) {
  return <group>
    <mesh castShadow position={[0,0.66,0]} material={bodyMaterial}><cylinderGeometry args={[0.17,0.22,0.48,32]} /></mesh>
    <mesh castShadow position={[0,0.98,0]} material={crownMaterial}><boxGeometry args={[0.09,0.28,0.09]} /></mesh>
    <mesh castShadow position={[0,1.08,0]} material={crownMaterial}><boxGeometry args={[0.28,0.075,0.09]} /></mesh>
    <mesh castShadow position={[0,0.86,0]} material={crownMaterial}><torusGeometry args={[0.15,0.022,12,38]} /></mesh>
  </group>
}
