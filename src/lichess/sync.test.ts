import { describe,expect,it } from 'vitest'
import { parseUciMoves,rebuildChess,isMovePrefix } from './sync'

describe('lichess sync',()=>{
  it('parses and rebuilds canonical UCI history',()=>{
    const moves=parseUciMoves('e2e4 e7e5 g1f3')
    const chess=rebuildChess(undefined,moves)
    expect(chess.history()).toEqual(['e4','e5','Nf3'])
  })
  it('detects append-only history and divergence',()=>{
    expect(isMovePrefix(['e2e4'],['e2e4','e7e5'])).toBe(true)
    expect(isMovePrefix(['e2e4','e7e5'],['e2e4'])).toBe(false)
    expect(isMovePrefix(['e2e4'],['d2d4'])).toBe(false)
  })
  it('supports promotion UCI',()=>{
    const chess=rebuildChess('8/P7/8/8/8/8/7p/4K2k w - - 0 1',['a7a8q'])
    expect(chess.get('a8')?.type).toBe('q')
  })
})
