import { buildAuthorizationUrl, exchangeCode, randomUrlSafeToken } from './oauth'
import { LichessClient, type LichessAccount } from './client'

const TOKEN_KEY = '3dchess.lichess.access-token'
const TRANSACTION_KEY = '3dchess.lichess.oauth-transaction'

interface Transaction {
  state: string
  verifier: string
  redirectUri: string
  clientId: string
}

function clientId(): string {
  return import.meta.env.VITE_LICHESS_CLIENT_ID || 'totoro0419-3dchess'
}

function redirectUri(): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  return url.toString()
}

export async function beginLichessLogin(): Promise<void> {
  const transaction: Transaction = {
    state: randomUrlSafeToken(24),
    verifier: randomUrlSafeToken(48),
    redirectUri: redirectUri(),
    clientId: clientId(),
  }
  sessionStorage.setItem(TRANSACTION_KEY, JSON.stringify(transaction))
  window.location.href = await buildAuthorizationUrl(transaction.clientId, transaction.redirectUri, transaction.state, transaction.verifier)
}

export async function completeLichessLogin(): Promise<string | null> {
  const url = new URL(window.location.href)
  const error = url.searchParams.get('error')
  if (error) throw new Error(`Lichess authorization failed: ${error}`)
  const code = url.searchParams.get('code')
  if (!code) return localStorage.getItem(TOKEN_KEY)
  const raw = sessionStorage.getItem(TRANSACTION_KEY)
  if (!raw) throw new Error('Missing OAuth transaction')
  const transaction = JSON.parse(raw) as Transaction
  if (url.searchParams.get('state') !== transaction.state) throw new Error('OAuth state mismatch')
  const token = await exchangeCode(transaction.clientId, transaction.redirectUri, code, transaction.verifier)
  localStorage.setItem(TOKEN_KEY, token)
  sessionStorage.removeItem(TRANSACTION_KEY)
  url.search = ''
  url.hash = ''
  history.replaceState(null, '', url)
  return token
}

export function disconnectLichess(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TRANSACTION_KEY)
}

export async function loadLichessAccount(token: string): Promise<LichessAccount> {
  return new LichessClient(token).account()
}
