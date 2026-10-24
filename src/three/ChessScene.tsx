import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import type { Color, Square } from 'chess.js'
import type { VisualPiece } from '../chess/localGame'
import { ChessBoard } from './ChessBoard'
import { Piece3D } from './Piece3D'

interface Props {
  pieces:VisualPiece[];selected:Square|null;legalTargets:Square[]
  lastMove:{from:Square;to:Square}|null;premove?:{from:Square;to:Square}|null
  turn:Color;interactionEnabled:boolean
  onSquareClick:(square:Square)=>void;onPieceDragStart:(square:Square)=>void
  onPieceDrop:(from:Square,to:Square)=>boolean;onPieceExited:(pieceId:string)=>void
}
export function ChessScene({pieces,selected,legalTargets,lastMove,premove,turn,interactionEnabled,onSquareClick,onPieceDragStart,onPieceDrop,onPieceExited}:Props){
  const [dragging,setDragging]=useState(false)
  return <Canvas shadows camera={{position:[0,7.2,8.2],fov:42}} dpr={[1,2]}>
    <color attach="background" args={['#0b0f14']}/>
    <ambientLight intensity={0.58}/>
    <directionalLight castShadow position={[4.8,9.5,5.8]} intensity={2.2} color="#fff0cf" shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
    <directionalLight position={[-5.5,5.2,-4.4]} intensity={0.82} color="#8fbcff"/>
    <directionalLight position={[0,4.5,-7]} intensity={0.45} color="#b7d3ff"/>
    <ChessBoard selected={selected} legalTargets={legalTargets} lastMove={lastMove} premove={premove} onSquareClick={onSquareClick}/>
    {pieces.map(piece=><Piece3D key={piece.id} piece={piece} selected={piece.square===selected&&!piece.captured} draggable={interactionEnabled&&piece.color===turn&&!piece.captured} onClick={()=>onSquareClick(piece.square)} onDragStart={onPieceDragStart} onDrop={onPieceDrop} onDragStateChange={setDragging} onExited={onPieceExited}/>)}
    <ContactShadows position={[0,0.14,0]} opacity={0.46} scale={10} blur={2.3} far={3}/>
    <Environment preset="studio" environmentIntensity={0.5}/>
    <OrbitControls makeDefault enabled={!dragging} enablePan={false} minDistance={7.5} maxDistance={12.5} minPolarAngle={Math.PI*0.18} maxPolarAngle={Math.PI*0.46} target={[0,0,0]}/>
  </Canvas>
}
