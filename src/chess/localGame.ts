import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'

export interface VisualPiece {
  id: string
  square: Square
  type: PieceSymbol
  color: 'w' | 'b'
  previousType?: PieceSymbol
  captured?: boolean
  motionDelayMs?: number
}

const files = 'abcdefgh'

export function createInitialVisualPieces(chess = new Chess()): VisualPiece[] {
  const pieces: VisualPiece[] = []
  for (let rank = 8; rank >= 1; rank--) {
    for (const file of files) {
      const square = `${file}${rank}` as Square
      const piece = chess.get(square)
      if (!piece) continue
      pieces.push({
        id: `${piece.color}-${piece.type}-${square}`,
        square,
        type: piece.type,
        color: piece.color,
      })
    }
  }
  return pieces
}

function enPassantCapturedSquare(move: Move): Square {
  const rank = Number(move.to[1]) + (move.color === 'w' ? -1 : 1)
  return `${move.to[0]}${rank}` as Square
}

export function applyMoveToVisualPieces(current: VisualPiece[], move: Move): VisualPiece[] {
  const captureSquare = move.flags.includes('e') ? enPassantCapturedSquare(move) : move.to
  const castling = move.flags.includes('k') || move.flags.includes('q')

  return current.map((piece) => {
    if (!piece.captured && move.captured && piece.square === captureSquare && piece.color !== move.color) {
      return { ...piece, captured: true }
    }

    if (!piece.captured && piece.square === move.from && piece.color === move.color) {
      return {
        ...piece,
        square: move.to,
        previousType: move.promotion ? piece.type : undefined,
        type: move.promotion ?? piece.type,
        motionDelayMs: 0,
      }
    }

    if (castling && !piece.captured && piece.type === 'r' && piece.color === move.color) {
      const mapping: Record<string, Square> = move.to[0] === 'g'
        ? { h1: 'f1', h8: 'f8' }
        : { a1: 'd1', a8: 'd8' }
      const to = mapping[piece.square]
      if (to) return { ...piece, square: to, motionDelayMs: 60 }
    }

    return piece
  })
}

export function describeGame(chess: Chess): string {
  if (chess.isCheckmate()) return `Checkmate — ${chess.turn() === 'w' ? 'Black' : 'White'} wins`
  if (chess.isStalemate()) return 'Draw — stalemate'
  if (chess.isThreefoldRepetition()) return 'Draw — threefold repetition'
  if (chess.isInsufficientMaterial()) return 'Draw — insufficient material'
  if (chess.isDraw()) return 'Draw'
  return `${chess.turn() === 'w' ? 'White' : 'Black'} to move${chess.inCheck() ? ' · Check' : ''}`
}
