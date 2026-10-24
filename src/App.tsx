import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { ChessScene } from './three/ChessScene'
import { applyMoveToVisualPieces, createInitialVisualPieces, describeGame, type VisualPiece } from './chess/localGame'
import { applyLocalUci, clearLocalGame, loadLocalGame, moveToLocalUci, saveLocalGame } from './chess/localPersistence'
import { LichessClient, type LichessAccount, type LichessBoardGameFull, type LichessBoardGameState, type LichessGameInfo } from './lichess/client'
import { beginLichessLogin, completeLichessLogin, disconnectLichess, loadLichessAccount } from './lichess/session'
import { applyUciMove, parseUciMoves, rebuildChess, uciFromMove } from './lichess/sync'

type Mode = 'local' | 'lichess'
type PromotionPiece = Extract<PieceSymbol, 'q'|'r'|'b'|'n'>

interface PendingPromotion { from:Square; to:Square }
const promotions: Array<{piece:PromotionPiece;label:string}> = [
  {piece:'q',label:'Queen'},{piece:'r',label:'Rook'},{piece:'b',label:'Bishop'},{piece:'n',label:'Knight'}
]

function lastMove(chess: Chess): {from:Square;to:Square}|null {
  const move=chess.history({verbose:true}).at(-1)
  return move?{from:move.from,to:move.to}:null
}

export default function App(){
  const initial=useRef<Chess|null>(null)
  if(!initial.current) initial.current=loadLocalGame()
  const game=useRef(initial.current)
  const redo=useRef<string[]>([])
  const onlineInitialFen=useRef<string|undefined>(undefined)
  const onlineMoves=useRef<string[]>([])

  const [mode,setMode]=useState<Mode>('local')
  const [pieces,setPieces]=useState<VisualPiece[]>(()=>createInitialVisualPieces(game.current))
  const [selected,setSelected]=useState<Square|null>(null)
  const [targets,setTargets]=useState<Square[]>([])
  const [last,setLast]=useState<{from:Square;to:Square}|null>(()=>lastMove(game.current))
  const [promotion,setPromotion]=useState<PendingPromotion|null>(null)
  const [revision,setRevision]=useState(0)
  const [redoCount,setRedoCount]=useState(0)

  const [token,setToken]=useState<string|null>(null)
  const [account,setAccount]=useState<LichessAccount|null>(null)
  const [lichessError,setLichessError]=useState<string|null>(null)
  const [onlineGame,setOnlineGame]=useState<LichessGameInfo|null>(null)
  const [onlineState,setOnlineState]=useState<LichessBoardGameState|null>(null)
  const [streamLabel,setStreamLabel]=useState('offline')

  const client=useMemo(()=>token?new LichessClient(token):null,[token])
  const status=useMemo(()=>describeGame(game.current),[revision])
  const history=useMemo(()=>game.current.history(),[revision])
  const turn=game.current.turn()
  const ownColor = onlineGame?.color==='white'?'w':onlineGame?.color==='black'?'b':null
  const onlineActive=mode==='lichess'&&onlineGame!==null&&onlineState?.status!=='mate'&&onlineState?.status!=='resign'&&onlineState?.status!=='draw'
  const interactionEnabled = !game.current.isGameOver() && !promotion && (mode==='local' || (onlineActive && ownColor===turn))

  useEffect(()=>{
    let cancelled=false
    void (async()=>{
      try{
        const nextToken=await completeLichessLogin()
        if(!nextToken||cancelled)return
        const nextAccount=await loadLichessAccount(nextToken)
        if(cancelled)return
        setToken(nextToken);setAccount(nextAccount);setLichessError(null)
      }catch(error){
        if(!cancelled)setLichessError(error instanceof Error?error.message:'Lichess login failed')
      }
    })()
    return()=>{cancelled=true}
  },[])

  useEffect(()=>{
    if(!client)return
    const controller=new AbortController()
    void (async()=>{
      try{
        setStreamLabel('event stream connected')
        for await(const event of client.eventStream(controller.signal)){
          if(event.type==='gameStart'){
            setOnlineGame(event.game)
            setMode('lichess')
          } else if(event.type==='gameFinish' && event.game?.gameId===onlineGame?.gameId){
            setStreamLabel('game finished')
          }
        }
      }catch(error){
        if(!controller.signal.aborted)setLichessError(error instanceof Error?error.message:'Lichess event stream failed')
      }
    })()
    return()=>controller.abort()
  },[client,onlineGame?.gameId])

  function rebuildVisualState(chess:Chess){
    game.current=chess
    setPieces(createInitialVisualPieces(chess))
    setLast(lastMove(chess))
    setSelected(null);setTargets([]);setPromotion(null)
    setRevision(v=>v+1)
  }

  function syncState(state:LichessBoardGameState){
    setOnlineState(state)
    const nextMoves=parseUciMoves(state.moves)
    const previous=onlineMoves.current
    try{
      if(previous.length+1===nextMoves.length && previous.every((m,i)=>m===nextMoves[i])){
        const move=applyUciMove(game.current,nextMoves.at(-1)!)
        setPieces(current=>applyMoveToVisualPieces(current,move))
        setLast({from:move.from,to:move.to})
        setRevision(v=>v+1)
      } else if(nextMoves.length!==previous.length || nextMoves.some((m,i)=>m!==previous[i])){
        rebuildVisualState(rebuildChess(onlineInitialFen.current,nextMoves))
      }
      onlineMoves.current=nextMoves
    }catch{
      rebuildVisualState(rebuildChess(onlineInitialFen.current,nextMoves))
      onlineMoves.current=nextMoves
    }
  }

  useEffect(()=>{
    if(!client||!onlineGame)return
    const controller=new AbortController()
    void (async()=>{
      try{
        setStreamLabel('game stream connecting')
        for await(const event of client.gameStream(onlineGame.gameId,controller.signal)){
          setStreamLabel('game stream connected')
          if(event.type==='gameFull'){
            const full=event as LichessBoardGameFull
            if(full.variant?.key && full.variant.key!=='standard') throw new Error('Only standard chess is supported')
            onlineInitialFen.current=full.initialFen
            onlineMoves.current=[]
            rebuildVisualState(rebuildChess(full.initialFen,[]))
            syncState(full.state)
          } else {
            syncState(event as LichessBoardGameState)
          }
        }
      }catch(error){
        if(!controller.signal.aborted){
          setStreamLabel('game stream error')
          setLichessError(error instanceof Error?error.message:'Lichess game stream failed')
        }
      }
    })()
    return()=>controller.abort()
  },[client,onlineGame?.gameId])

  function legalTargets(square:Square):Square[]{
    return Array.from(new Set(game.current.moves({square,verbose:true}).map(move=>move.to)))
  }

  function selectSquare(square:Square){
    if(!interactionEnabled)return
    const piece=game.current.get(square)
    if(!selected){
      if(piece?.color===turn){setSelected(square);setTargets(legalTargets(square))}
      return
    }
    if(piece?.color===turn){setSelected(square);setTargets(legalTargets(square));return}
    attemptMove(selected,square)
  }

  function commitMove(move:Move){
    setPieces(current=>applyMoveToVisualPieces(current,move))
    setLast({from:move.from,to:move.to})
    setSelected(null);setTargets([]);setRevision(v=>v+1)
    if(mode==='local'){
      redo.current=[];setRedoCount(0);saveLocalGame(game.current)
    }else if(client&&onlineGame){
      const uci=uciFromMove(move)
      void client.move(onlineGame.gameId,uci).catch(error=>{
        game.current.undo()
        rebuildVisualState(game.current)
        setLichessError(error instanceof Error?error.message:'Move rejected')
      })
    }
  }

  function attemptMove(from:Square,to:Square):boolean{
    const candidates=game.current.moves({square:from,verbose:true}).filter(move=>move.to===to)
    if(!candidates.length)return false
    if(candidates.some(move=>move.promotion)){setPromotion({from,to});setSelected(null);setTargets([]);return false}
    try{const move=game.current.move({from,to});commitMove(move);return true}catch{return false}
  }

  function choosePromotion(piece:PromotionPiece){
    if(!promotion)return
    try{const move=game.current.move({...promotion,promotion:piece});commitMove(move)}finally{setPromotion(null)}
  }

  function undo(){
    if(mode!=='local')return
    const move=game.current.undo();if(!move)return
    redo.current.push(moveToLocalUci(move));setRedoCount(redo.current.length)
    saveLocalGame(game.current);rebuildVisualState(game.current)
  }

  function redoMove(){
    if(mode!=='local')return
    const uci=redo.current.pop();if(!uci)return
    try{const move=applyLocalUci(game.current,uci);setRedoCount(redo.current.length);commitMove(move);saveLocalGame(game.current)}catch{redo.current=[];setRedoCount(0)}
  }

  function resetLocal(){
    game.current=new Chess();clearLocalGame();redo.current=[];setRedoCount(0)
    setMode('local');setOnlineGame(null);setOnlineState(null);onlineMoves.current=[]
    rebuildVisualState(game.current)
  }

  async function connect(){setLichessError(null);try{await beginLichessLogin()}catch(error){setLichessError(error instanceof Error?error.message:'Could not start Lichess login')}}
  function disconnect(){disconnectLichess();setToken(null);setAccount(null);setOnlineGame(null);setOnlineState(null);setStreamLabel('offline');if(mode==='lichess')resetLocal()}

  return <div className="app">
    <main className="board-shell">
      <ChessScene pieces={pieces} selected={selected} legalTargets={targets} lastMove={last} turn={turn} interactionEnabled={interactionEnabled}
        onSquareClick={selectSquare}
        onPieceDragStart={square=>{setSelected(square);setTargets(legalTargets(square))}}
        onPieceDrop={attemptMove}
        onPieceExited={id=>setPieces(current=>current.filter(piece=>piece.id!==id))}
      />
      <div className="status-strip"><strong>{mode==='lichess'?'Lichess':'Local'}</strong><span>{status}</span></div>
    </main>

    <aside className="panel">
      <header><p className="eyebrow">3D CHESS</p><h1>Play with weight.</h1><p>Readable Staunton-inspired pieces, smooth motion, and Lichess Board API support.</p></header>

      <section className="card">
        <div className="row between"><strong>Local game</strong><span>{history.length} ply</span></div>
        <div className="actions">
          <button onClick={undo} disabled={mode!=='local'||history.length===0}>Undo</button>
          <button onClick={redoMove} disabled={mode!=='local'||redoCount===0}>Redo</button>
          <button className="secondary" onClick={resetLocal}>New game</button>
        </div>
      </section>

      <section className="card">
        <div className="row between"><strong>Lichess</strong><span className="muted">{streamLabel}</span></div>
        {account ? <>
          <div className="account"><span>@{account.username}</span><span>{account.perfs?.rapid?.rating ?? '—'} rapid</span></div>
          <div className="actions"><button className="secondary" onClick={disconnect} disabled={onlineActive}>Disconnect</button></div>
        </> : <button onClick={connect}>Connect Lichess</button>}
        {onlineGame && <div className="online-box">
          <span>Game: {onlineGame.gameId}</span>
          <span>Playing {onlineGame.color ?? '—'}</span>
          <div className="actions">
            <button className="secondary" onClick={()=>client?.draw(onlineGame.gameId,true)}>Offer draw</button>
            <button className="secondary" onClick={()=>client?.takeback(onlineGame.gameId,true)}>Takeback</button>
            <button className="danger" onClick={()=>client?.resign(onlineGame.gameId)}>Resign</button>
          </div>
        </div>}
        {lichessError && <p className="error">{lichessError}</p>}
        <p className="fine">Live human games do not expose engine evaluation, hints, or best moves.</p>
      </section>

      <section className="card moves"><strong>Moves</strong><div>{history.length?history.map((move,i)=><span key={i}>{i+1}. {move}</span>):<span className="muted">No moves yet.</span>}</div></section>
    </aside>

    {promotion && <div className="modal-backdrop"><div className="promotion-card"><strong>Promote pawn</strong><div className="promotion-grid">{promotions.map(choice=><button key={choice.piece} onClick={()=>choosePromotion(choice.piece)}>{choice.label}</button>)}</div><button className="secondary" onClick={()=>setPromotion(null)}>Cancel</button></div></div>}
  </div>
}
