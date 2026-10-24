import * as THREE from 'three'
import type { PieceSymbol, Square } from 'chess.js'

export const BOARD_SURFACE_Y = 0.16
export const PIECE_BASE_Y = 0.19

export function squareToWorld(square: Square): THREE.Vector3 {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1])
  return new THREE.Vector3(file - 3.5, PIECE_BASE_Y, 4.5 - rank)
}

export function worldToSquare(point: THREE.Vector3): Square | null {
  const file = Math.round(point.x + 3.5)
  const rankIndex = Math.round(point.z + 3.5)
  if (file < 0 || file > 7 || rankIndex < 0 || rankIndex > 7) return null
  return `${'abcdefgh'[file]}${8 - rankIndex}` as Square
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function moveDurationMs(from: THREE.Vector3, to: THREE.Vector3): number {
  const distance = Math.hypot(to.x - from.x, to.z - from.z)
  return Math.min(280, 170 + distance * 12)
}

export function arcHeight(type: PieceSymbol): number {
  return type === 'n' ? 0.34 : 0.1
}
