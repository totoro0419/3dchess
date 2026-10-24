import { parseNdjson } from './ndjson'

const API = 'https://lichess.org/api'

export interface LichessAccount {
  id: string
  username: string
  perfs?: { rapid?: { rating?: number } }
}

export interface LichessGameInfo {
  gameId: string
  color?: 'white' | 'black'
  fen?: string
  hasMoved?: boolean
  isMyTurn?: boolean
  lastMove?: string
  opponent?: { username?: string; rating?: number }
}

export interface LichessBoardGameState {
  type: 'gameState'
  moves: string
  wtime?: number
  btime?: number
  winc?: number
  binc?: number
  status?: string
  winner?: 'white' | 'black'
  wdraw?: boolean
  bdraw?: boolean
  wtakeback?: boolean
  btakeback?: boolean
}

export interface LichessBoardGameFull {
  type: 'gameFull'
  id: string
  initialFen?: string
  rated?: boolean
  speed?: string
  variant?: { key?: string; name?: string }
  white?: { id?: string; name?: string; rating?: number }
  black?: { id?: string; name?: string; rating?: number }
  state: LichessBoardGameState
}

type Event =
  | { type: 'gameStart'; game: LichessGameInfo }
  | { type: 'gameFinish'; game: LichessGameInfo }
  | { type: string; [key: string]: unknown }

export class LichessClient {
  private queue: Promise<unknown> = Promise.resolve()
  constructor(private token: string) {}

  private headers(): HeadersInit {
    return { Authorization: `Bearer ${this.token}` }
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task)
    this.queue = next.then(() => undefined, () => undefined)
    return next
  }

  async account(): Promise<LichessAccount> {
    const response = await fetch(`${API}/account`, { headers: this.headers() })
    if (!response.ok) throw new Error(`Lichess account failed (${response.status})`)
    return response.json()
  }

  async *eventStream(signal?: AbortSignal): AsyncGenerator<Event> {
    const response = await fetch(`${API}/stream/event`, { headers: this.headers(), signal })
    if (!response.ok) throw new Error(`Lichess event stream failed (${response.status})`)
    yield* parseNdjson<Event>(response.body)
  }

  async *gameStream(gameId: string, signal?: AbortSignal): AsyncGenerator<LichessBoardGameFull | LichessBoardGameState> {
    const response = await fetch(`${API}/board/game/stream/${gameId}`, { headers: this.headers(), signal })
    if (!response.ok) throw new Error(`Lichess game stream failed (${response.status})`)
    yield* parseNdjson<LichessBoardGameFull | LichessBoardGameState>(response.body)
  }

  move(gameId: string, uci: string): Promise<void> {
    return this.enqueue(async () => {
      const response = await fetch(`${API}/board/game/${gameId}/move/${uci}`, {
        method: 'POST', headers: this.headers(),
      })
      if (!response.ok) throw new Error(`Lichess move failed (${response.status})`)
    })
  }

  resign(gameId: string): Promise<void> {
    return this.enqueue(async () => {
      const response = await fetch(`${API}/board/game/${gameId}/resign`, { method: 'POST', headers: this.headers() })
      if (!response.ok) throw new Error(`Lichess resign failed (${response.status})`)
    })
  }

  draw(gameId: string, accept: boolean): Promise<void> {
    return this.enqueue(async () => {
      const response = await fetch(`${API}/board/game/${gameId}/draw/${accept ? 'yes' : 'no'}`, { method: 'POST', headers: this.headers() })
      if (!response.ok) throw new Error(`Lichess draw action failed (${response.status})`)
    })
  }

  takeback(gameId: string, accept: boolean): Promise<void> {
    return this.enqueue(async () => {
      const response = await fetch(`${API}/board/game/${gameId}/takeback/${accept ? 'yes' : 'no'}`, { method: 'POST', headers: this.headers() })
      if (!response.ok) throw new Error(`Lichess takeback action failed (${response.status})`)
    })
  }

  abort(gameId: string): Promise<void> {
    return this.enqueue(async () => {
      const response = await fetch(`${API}/board/game/${gameId}/abort`, { method: 'POST', headers: this.headers() })
      if (!response.ok) throw new Error(`Lichess abort failed (${response.status})`)
    })
  }
}
