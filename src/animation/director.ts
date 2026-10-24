import * as THREE from 'three'
import type { PieceSymbol } from 'chess.js'
import { arcHeight, moveDurationMs } from './motion'

export type PieceAnimationKind = 'move' | 'drag-snap' | 'drag-return' | 'capture'

export interface PieceMotionProfile {
  delayMs: number
  durationMs: number
  arc: number
}

class AnimationDirector {
  readonly castlingRookDelayMs = 60
  readonly captureDurationMs = 210
  readonly dragSnapDurationMs = 105
  readonly dragReturnDurationMs = 160

  moveProfile(type: PieceSymbol, from: THREE.Vector3, to: THREE.Vector3, delayMs = 0): PieceMotionProfile {
    return { delayMs, durationMs: moveDurationMs(from, to), arc: arcHeight(type) }
  }

  fixedProfile(kind: 'drag-snap' | 'drag-return'): PieceMotionProfile {
    return {
      delayMs: 0,
      durationMs: kind === 'drag-snap' ? this.dragSnapDurationMs : this.dragReturnDurationMs,
      arc: kind === 'drag-snap' ? 0.055 : 0.08,
    }
  }
}

export const animationDirector = new AnimationDirector()
