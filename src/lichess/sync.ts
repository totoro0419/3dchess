import { Chess, type Move } from 'chess.js'

export function parseUciMoves(moves: string): string[] {
  return moves.trim() ? moves.trim().split(/\s+/) : []
}

export function applyUciMove(chess: Chess, uci: string): Move {
  const move = chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    ...(uci[4] ? { promotion: uci[4] } : {}),
  })
  if (!move) throw new Error(`Illegal UCI move: ${uci}`)
  return move
}

export function rebuildChess(initialFen: string | undefined, moves: string[]): Chess {
  const chess = !initialFen || initialFen === 'startpos' ? new Chess() : new Chess(initialFen)
  for (const move of moves) applyUciMove(chess, move)
  return chess
}

export function uciFromMove(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`
}

export function isMovePrefix(previous: string[], next: string[]): boolean {
  return previous.length <= next.length && previous.every((move, index) => move === next[index])
}
