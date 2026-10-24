import { useEffect, useRef, useState } from 'react'
import { type ThreeEvent, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Square } from 'chess.js'
import type { VisualPiece } from '../chess/localGame'
import { animationDirector, type PieceAnimationKind } from '../animation/director'
import { PIECE_BASE_Y, easeOutCubic, squareToWorld, worldToSquare } from '../animation/motion'
import { PieceModel } from './PieceModel'

interface Props {
  piece:VisualPiece; selected:boolean; draggable:boolean
  onClick:()=>void; onDragStart:(square:Square)=>void
  onDrop:(from:Square,to:Square)=>boolean
  onDragStateChange:(dragging:boolean)=>void
  onExited:(pieceId:string)=>void
}
interface MotionState {active:boolean;startMs:number;durationMs:number;from:THREE.Vector3;to:THREE.Vector3;arc:number;kind:PieceAnimationKind}
interface DragCandidate {pointerId:number;startX:number;startY:number;origin:Square;dragging:boolean}
interface CaptureState {startMs:number;baseY:number;notified:boolean}

const DRAG_THRESHOLD_PX=5, DRAG_LIFT=0.31
const DRAG_PLANE=new THREE.Plane(new THREE.Vector3(0,1,0),-PIECE_BASE_Y)

export function Piece3D({piece,selected,draggable,onClick,onDragStart,onDrop,onDragStateChange,onExited}:Props){
  const group=useRef<THREE.Group>(null)
  const previousSquare=useRef(piece.square)
  const suppressNextSquareMotion=useRef(false)
  const suppressClick=useRef(false)
  const dragCandidate=useRef<DragCandidate|null>(null)
  const captureState=useRef<CaptureState|null>(null)
  const [isAnimating,setIsAnimating]=useState(false)
  const initial=squareToWorld(piece.square)
  const motion=useRef<MotionState>({active:false,startMs:0,durationMs:0,from:initial.clone(),to:initial.clone(),arc:0,kind:'move'})

  function beginMotion(kind:'drag-snap'|'drag-return',from:THREE.Vector3,to:THREE.Vector3){
    const p=animationDirector.fixedProfile(kind)
    motion.current={active:true,startMs:performance.now()+p.delayMs,durationMs:p.durationMs,from:from.clone(),to:to.clone(),arc:p.arc,kind}
    setIsAnimating(true)
  }

  useEffect(()=>{
    if(!group.current)return
    const target=squareToWorld(piece.square)
    if(suppressNextSquareMotion.current){suppressNextSquareMotion.current=false;previousSquare.current=piece.square;return}
    if(previousSquare.current===piece.square){if(!motion.current.active&&!dragCandidate.current?.dragging)group.current.position.copy(target);return}
    const from=group.current.position.clone()
    const p=animationDirector.moveProfile(piece.type,from,target,piece.motionDelayMs??0)
    motion.current={active:true,startMs:performance.now()+p.delayMs,durationMs:p.durationMs,from,to:target,arc:p.arc,kind:'move'}
    setIsAnimating(true); previousSquare.current=piece.square
  },[piece.square,piece.type,piece.motionDelayMs])

  useEffect(()=>{if(piece.captured&&group.current&&!captureState.current)captureState.current={startMs:performance.now(),baseY:group.current.position.y,notified:false}},[piece.captured])

  useFrame(()=>{
    const object=group.current;if(!object)return
    const capture=captureState.current
    if(capture){
      const progress=Math.min(1,(performance.now()-capture.startMs)/animationDirector.captureDurationMs)
      const eased=easeOutCubic(progress)
      object.scale.setScalar(1-0.12*eased);object.position.y=capture.baseY+0.05*eased
      object.traverse(child=>{if(child instanceof THREE.Mesh){const ms=Array.isArray(child.material)?child.material:[child.material];for(const m of ms){m.transparent=true;m.opacity=1-eased}}})
      if(progress>=1&&!capture.notified){capture.notified=true;object.visible=false;onExited(piece.id)}
      return
    }
    if(dragCandidate.current?.dragging)return
    const state=motion.current, lift=selected?0.09:0
    if(!state.active){object.position.y=THREE.MathUtils.lerp(object.position.y,PIECE_BASE_Y+lift,0.2);object.scale.setScalar(THREE.MathUtils.lerp(object.scale.x,selected?1.025:1,0.18));return}
    const now=performance.now();if(now<state.startMs)return
    const progress=Math.min(1,(now-state.startMs)/state.durationMs), eased=easeOutCubic(progress)
    object.position.x=THREE.MathUtils.lerp(state.from.x,state.to.x,eased)
    object.position.z=THREE.MathUtils.lerp(state.from.z,state.to.z,eased)
    object.position.y=PIECE_BASE_Y+Math.sin(Math.PI*progress)*state.arc+lift
    if(progress>=1){object.position.copy(state.to);object.position.y+=lift;state.active=false;setIsAnimating(false)}
  })

  const displayType=isAnimating&&piece.previousType?piece.previousType:piece.type
  const pointerPoint=(e:ThreeEvent<PointerEvent>)=>{const p=new THREE.Vector3();return e.ray.intersectPlane(DRAG_PLANE,p)?p:null}
  const capturePointer=(e:ThreeEvent<PointerEvent>)=>{
    const target=e.nativeEvent.target as Element|null
    target?.setPointerCapture?.(e.pointerId)
  }
  const releasePointer=(e:ThreeEvent<PointerEvent>)=>{
    const target=e.nativeEvent.target as Element|null
    if(target?.hasPointerCapture?.(e.pointerId))target.releasePointerCapture(e.pointerId)
  }

  return <group ref={group} position={initial}
    onPointerDown={e=>{if(!draggable||piece.captured)return;e.stopPropagation();dragCandidate.current={pointerId:e.pointerId,startX:e.nativeEvent.clientX,startY:e.nativeEvent.clientY,origin:piece.square,dragging:false}}}
    onPointerMove={e=>{const c=dragCandidate.current,o=group.current;if(!c||c.pointerId!==e.pointerId||!o)return;if(!c.dragging){if(Math.hypot(e.nativeEvent.clientX-c.startX,e.nativeEvent.clientY-c.startY)<DRAG_THRESHOLD_PX)return;c.dragging=true;capturePointer(e);suppressClick.current=true;motion.current.active=false;onDragStart(c.origin);onDragStateChange(true)}e.stopPropagation();const p=pointerPoint(e);if(!p)return;o.position.set(THREE.MathUtils.clamp(p.x,-3.9,3.9),PIECE_BASE_Y+DRAG_LIFT,THREE.MathUtils.clamp(p.z,-3.9,3.9));o.scale.setScalar(1.035)}}
    onPointerUp={e=>{const c=dragCandidate.current,o=group.current;if(!c||c.pointerId!==e.pointerId||!o)return;releasePointer(e);dragCandidate.current=null;if(!c.dragging)return;e.stopPropagation();onDragStateChange(false);const point=pointerPoint(e)??o.position.clone();const target=worldToSquare(point);const accepted=target?onDrop(c.origin,target):false;const destination=squareToWorld(accepted&&target?target:c.origin);if(accepted)suppressNextSquareMotion.current=true;beginMotion(accepted?'drag-snap':'drag-return',o.position,destination)}}
    onPointerCancel={e=>{const c=dragCandidate.current,o=group.current;if(!c||!o)return;releasePointer(e);dragCandidate.current=null;if(c.dragging)onDragStateChange(false);beginMotion('drag-return',o.position,squareToWorld(c.origin))}}
    onClick={e=>{e.stopPropagation();if(piece.captured)return;if(suppressClick.current){suppressClick.current=false;return}onClick()}}
  >
    <group scale={1.04}>
      <PieceModel type={displayType} colorKey={piece.color}/>
    </group>
    {selected&&!piece.captured&&<mesh position={[0,0.015,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[0.32,0.41,56]}/><meshBasicMaterial color="#f6c34e" transparent opacity={0.92}/></mesh>}
  </group>
}
