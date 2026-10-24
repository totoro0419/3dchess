import { Chess, type Move } from 'chess.js'

const KEY = '3dchess.local-game.v1'

interface SavedLocalGame {
  version: 1
  moves: string[]
}

export function moveToLocalUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`
}

export function applyLocalUci(chess: Chess, uci: string): Move {
  const from = uci.slice(0, 2)
  const to = uci.slice(2, 4)
  const promotion = uci[4]
  const move = chess.move({
    from,
    to,
    ...(promotion ? { promotion } : {}),
  })
  if (!move) throw new Error(`Illegal move: ${uci}`)
  return move
}

export function saveLocalGame(chess: Chess): void {
  if (typeof localStorage === 'undefined') return
  const moves = chess.history({ verbose: true }).map(moveToLocalUci)
  localStorage.setItem(KEY, JSON.stringify({ version: 1, moves } satisfies SavedLocalGame))
}

export function loadLocalGame(): Chess {
  const chess = new Chess()
  if (typeof localStorage === 'undefined') return chess
  const raw = localStorage.getItem(KEY)
  if (!raw) return chess
  try {
    const parsed = JSON.parse(raw) as SavedLocalGame
    if (parsed.version !== 1 || !Array.isArray(parsed.moves)) throw new Error('Invalid save')
    for (const uci of parsed.moves) applyLocalUci(chess, uci)
    return chess
  } catch {
    localStorage.removeItem(KEY)
    return new Chess()
  }
}

export function clearLocalGame(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
}
