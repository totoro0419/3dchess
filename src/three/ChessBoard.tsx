import type { Square } from 'chess.js'

const files = ['a','b','c','d','e','f','g','h'] as const

interface Props {
  selected: Square | null
  legalTargets: Square[]
  lastMove: {from:Square;to:Square}|null
  premove?: {from:Square;to:Square}|null
  onSquareClick:(square:Square)=>void
}

export function ChessBoard({selected,legalTargets,lastMove,premove,onSquareClick}:Props){
  const legal=new Set(legalTargets)
  return <group>
    <mesh receiveShadow position={[0,0,0]}>
      <boxGeometry args={[8.65,0.24,8.65]} />
      <meshStandardMaterial color="#4b2d1f" roughness={0.62} metalness={0.03} />
    </mesh>
    {Array.from({length:8},(_,rankIndex)=>files.map((file,fileIndex)=>{
      const rank=8-rankIndex
      const square=`${file}${rank}` as Square
      const x=fileIndex-3.5, z=rankIndex-3.5
      const dark=(rankIndex+fileIndex)%2===1
      const isSelected=selected===square
      const isLegal=legal.has(square)
      const isLast=lastMove?.from===square||lastMove?.to===square
      const isPremove=premove?.from===square||premove?.to===square
      return <group key={square} position={[x,0.13,z]}>
        <mesh receiveShadow onClick={e=>{e.stopPropagation();onSquareClick(square)}}>
          <boxGeometry args={[0.98,0.12,0.98]} />
          <meshStandardMaterial
            color={isSelected?'#d7ad4d':isPremove?'#8f5c8f':isLast?'#9c7a38':dark?'#5e3d2d':'#d9c2a0'}
            roughness={0.72}
          />
        </mesh>
        {isLegal && <mesh position={[0,0.075,0]} rotation={[-Math.PI/2,0,0]}>
          <ringGeometry args={[0.1,0.18,32]} />
          <meshBasicMaterial color="#e4b84e" transparent opacity={0.85} />
        </mesh>}
      </group>
    }))}
  </group>
}
