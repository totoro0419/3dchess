import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { PieceSymbol } from 'chess.js'

type Mats = {
  body: THREE.MeshStandardMaterial
  detail: THREE.MeshStandardMaterial
  accent: THREE.MeshStandardMaterial
  darkCut: THREE.MeshStandardMaterial
}

export function PieceModel({ type, colorKey }: { type: PieceSymbol; colorKey: 'w' | 'b' }) {
  const mats = usePieceMaterials(colorKey)

  return (
    <group>
      <PieceBase mats={mats} />
      {type === 'p' && <PawnModel mats={mats} />}
      {type === 'r' && <RookModel mats={mats} />}
      {type === 'n' && <KnightModel mats={mats} />}
      {type === 'b' && <BishopModel mats={mats} />}
      {type === 'q' && <QueenModel mats={mats} />}
      {type === 'k' && <KingModel mats={mats} />}
    </group>
  )
}

function usePieceMaterials(colorKey: 'w' | 'b'): Mats {
  const palette = useMemo(() => createPalette(colorKey), [colorKey])

  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.body,
        roughness: 0.22,
        metalness: 0.18,
        emissive: palette.emissive,
        emissiveIntensity: 0.04,
      }),
    [palette.body, palette.emissive],
  )

  const detail = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.detail,
        roughness: 0.28,
        metalness: 0.38,
      }),
    [palette.detail],
  )

  const accent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.16,
        metalness: 0.5,
        emissive: palette.emissive,
        emissiveIntensity: 0.02,
      }),
    [palette.accent, palette.emissive],
  )

  const darkCut = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: palette.cut,
        roughness: 0.45,
        metalness: 0.08,
      }),
    [palette.cut],
  )

  useEffect(() => {
    return () => {
      body.dispose()
      detail.dispose()
      accent.dispose()
      darkCut.dispose()
    }
  }, [body, detail, accent, darkCut])

  return { body, detail, accent, darkCut }
}

function createPalette(colorKey: 'w' | 'b') {
  if (colorKey === 'w') {
    return {
      body: '#f2ede3',
      detail: '#ccb27b',
      accent: '#f3d58c',
      emissive: '#6f5320',
      cut: '#7a6b55',
    }
  }

  return {
    body: '#262d37',
    detail: '#7caedc',
    accent: '#a9d1ff',
    emissive: '#23496d',
    cut: '#151b22',
  }
}

function PieceBase({ mats }: { mats: Mats }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.05, 0]} material={mats.detail}>
        <cylinderGeometry args={[0.43, 0.47, 0.06, 48]} />
      </mesh>
      <mesh castShadow position={[0, 0.1, 0]} material={mats.body}>
        <cylinderGeometry args={[0.37, 0.42, 0.05, 48]} />
      </mesh>
      <mesh castShadow position={[0, 0.145, 0]} material={mats.detail}>
        <torusGeometry args={[0.31, 0.03, 18, 52]} />
      </mesh>
      <mesh castShadow position={[0, 0.195, 0]} material={mats.body}>
        <cylinderGeometry args={[0.28, 0.31, 0.055, 44]} />
      </mesh>
      <mesh castShadow position={[0, 0.245, 0]} material={mats.detail}>
        <torusGeometry args={[0.25, 0.022, 16, 48]} />
      </mesh>
    </group>
  )
}

function CoreColumn({
  mats,
  y = 0.42,
  topR = 0.16,
  bottomR = 0.24,
  h = 0.34,
}: {
  mats: Mats
  y?: number
  topR?: number
  bottomR?: number
  h?: number
}) {
  return (
    <group>
      <mesh castShadow position={[0, y, 0]} material={mats.body}>
        <cylinderGeometry args={[topR, bottomR, h, 40]} />
      </mesh>
      <mesh castShadow position={[0, y + h * 0.34, 0]} material={mats.detail}>
        <torusGeometry args={[topR + 0.015, 0.02, 14, 40]} />
      </mesh>
      <mesh castShadow position={[0, y - h * 0.34, 0]} material={mats.detail}>
        <torusGeometry args={[bottomR - 0.01, 0.018, 14, 40]} />
      </mesh>
    </group>
  )
}

function PawnModel({ mats }: { mats: Mats }) {
  return (
    <group>
      <CoreColumn mats={mats} y={0.39} topR={0.12} bottomR={0.2} h={0.32} />
      <mesh castShadow position={[0, 0.58, 0]} material={mats.detail}>
        <torusGeometry args={[0.115, 0.023, 14, 36]} />
      </mesh>
      <mesh castShadow position={[0, 0.69, 0]} material={mats.body}>
        <sphereGeometry args={[0.16, 30, 26]} />
      </mesh>
    </group>
  )
}

function RookModel({ mats }: { mats: Mats }) {
  return (
    <group>
      <CoreColumn mats={mats} y={0.44} topR={0.18} bottomR={0.23} h={0.38} />
      <mesh castShadow position={[0, 0.69, 0]} material={mats.body}>
        <cylinderGeometry args={[0.2, 0.19, 0.22, 40]} />
      </mesh>
      <mesh castShadow position={[0, 0.83, 0]} material={mats.detail}>
        <cylinderGeometry args={[0.27, 0.22, 0.08, 48]} />
      </mesh>
      <mesh castShadow position={[0, 0.88, 0]} material={mats.detail}>
        <torusGeometry args={[0.22, 0.018, 12, 44]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.cos(a) * 0.18, 0.94, Math.sin(a) * 0.18]}
            material={mats.body}
          >
            <boxGeometry args={[0.07, 0.1, 0.08]} />
          </mesh>
        )
      })}
    </group>
  )
}

function BishopModel({ mats }: { mats: Mats }) {
  return (
    <group>
      <CoreColumn mats={mats} y={0.43} topR={0.135} bottomR={0.215} h={0.38} />
      <mesh castShadow position={[0, 0.66, 0]} material={mats.body}>
        <sphereGeometry args={[0.16, 28, 24]} />
      </mesh>
      <mesh castShadow position={[0, 0.82, 0]} material={mats.body}>
        <coneGeometry args={[0.13, 0.28, 36]} />
      </mesh>
      <mesh castShadow position={[0, 0.93, 0]} material={mats.detail}>
        <sphereGeometry args={[0.055, 18, 16]} />
      </mesh>
      <mesh castShadow position={[0.038, 0.8, 0]} rotation={[0, 0, -0.62]} material={mats.darkCut}>
        <boxGeometry args={[0.03, 0.19, 0.17]} />
      </mesh>
      <mesh castShadow position={[0.02, 0.8, 0]} rotation={[0, 0, -0.62]} material={mats.accent}>
        <boxGeometry args={[0.012, 0.17, 0.172]} />
      </mesh>
    </group>
  )
}

function KnightModel({ mats }: { mats: Mats }) {
  return (
    <group>
      <CoreColumn mats={mats} y={0.4} topR={0.145} bottomR={0.215} h={0.31} />
      <mesh castShadow position={[0, 0.57, -0.015]} material={mats.detail}>
        <cylinderGeometry args={[0.14, 0.16, 0.08, 28]} />
      </mesh>
      <mesh castShadow position={[0.01, 0.75, 0]} rotation={[0.05, 0, -0.18]} material={mats.body}>
        <boxGeometry args={[0.24, 0.42, 0.18]} />
      </mesh>
      <mesh castShadow position={[0.11, 0.95, 0]} rotation={[0, 0, -0.52]} material={mats.body}>
        <boxGeometry args={[0.18, 0.3, 0.18]} />
      </mesh>
      <mesh castShadow position={[0.185, 1.025, 0]} rotation={[0, 0, -0.25]} material={mats.detail}>
        <boxGeometry args={[0.11, 0.1, 0.13]} />
      </mesh>
      <mesh castShadow position={[0.14, 0.91, 0]} rotation={[0, 0, -0.58]} material={mats.body}>
        <boxGeometry args={[0.09, 0.16, 0.12]} />
      </mesh>
      <mesh castShadow position={[-0.03, 0.88, 0]} rotation={[0, 0, 0.14]} material={mats.body}>
        <boxGeometry args={[0.08, 0.24, 0.12]} />
      </mesh>
      <mesh castShadow position={[0.09, 1.12, 0.055]} rotation={[0.12, 0, 0.1]} material={mats.accent}>
        <coneGeometry args={[0.025, 0.09, 16]} />
      </mesh>
      <mesh castShadow position={[0.09, 1.12, -0.055]} rotation={[-0.12, 0, 0.1]} material={mats.accent}>
        <coneGeometry args={[0.025, 0.09, 16]} />
      </mesh>
      <mesh castShadow position={[0.205, 1.02, 0.055]} material={mats.darkCut}>
        <sphereGeometry args={[0.018, 12, 10]} />
      </mesh>
      <mesh castShadow position={[0.205, 1.02, -0.055]} material={mats.darkCut}>
        <sphereGeometry args={[0.018, 12, 10]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={i}
          castShadow
          position={[-0.02 - i * 0.015, 0.98 - i * 0.06, 0]}
          rotation={[0, 0, 0.24]}
          material={mats.detail}
        >
          <boxGeometry args={[0.025, 0.12, 0.19]} />
        </mesh>
      ))}
    </group>
  )
}

function QueenModel({ mats }: { mats: Mats }) {
  return (
    <group>
      <CoreColumn mats={mats} y={0.47} topR={0.145} bottomR={0.225} h={0.44} />
      <mesh castShadow position={[0, 0.76, 0]} material={mats.body}>
        <cylinderGeometry args={[0.16, 0.18, 0.2, 36]} />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0]} material={mats.detail}>
        <torusGeometry args={[0.16, 0.022, 16, 48]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <group key={i}>
            <mesh
              castShadow
              position={[Math.cos(a) * 0.13, 0.98, Math.sin(a) * 0.13]}
              material={mats.accent}
            >
              <sphereGeometry args={[0.038, 16, 14]} />
            </mesh>
            <mesh
              castShadow
              position={[Math.cos(a) * 0.11, 0.95, Math.sin(a) * 0.11]}
              material={mats.accent}
            >
              <cylinderGeometry args={[0.012, 0.018, 0.08, 12]} />
            </mesh>
          </group>
        )
      })}
      <mesh castShadow position={[0, 1.04, 0]} material={mats.accent}>
        <sphereGeometry args={[0.045, 16, 14]} />
      </mesh>
    </group>
  )
}

function KingModel({ mats }: { mats: Mats }) {
  return (
    <group>
      <CoreColumn mats={mats} y={0.49} topR={0.15} bottomR={0.23} h={0.48} />
      <mesh castShadow position={[0, 0.78, 0]} material={mats.body}>
        <cylinderGeometry args={[0.16, 0.18, 0.22, 36]} />
      </mesh>
      <mesh castShadow position={[0, 0.93, 0]} material={mats.detail}>
        <torusGeometry args={[0.145, 0.02, 14, 44]} />
      </mesh>
      <mesh castShadow position={[0, 1.04, 0]} material={mats.accent}>
        <cylinderGeometry args={[0.04, 0.04, 0.22, 18]} />
      </mesh>
      <mesh castShadow position={[0, 1.13, 0]} material={mats.accent}>
        <boxGeometry args={[0.24, 0.07, 0.08]} />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0]} material={mats.accent}>
        <boxGeometry args={[0.08, 0.15, 0.08]} />
      </mesh>
    </group>
  )
}
