import { describe, expect, it } from 'vitest'
import { parseNdjson } from './ndjson'

function stream(chunks:string[]):ReadableStream<Uint8Array>{
  const encoder=new TextEncoder()
  return new ReadableStream({start(controller){for(const chunk of chunks)controller.enqueue(encoder.encode(chunk));controller.close()}})
}

describe('parseNdjson',()=>{
  it('handles records split across transport chunks',async()=>{
    const out:unknown[]=[]
    for await(const value of parseNdjson(stream(['{"a":1}\n{"b"',':2}\n'])))out.push(value)
    expect(out).toEqual([{a:1},{b:2}])
  })
  it('ignores keepalive blank lines and reads tail without newline',async()=>{
    const out:unknown[]=[]
    for await(const value of parseNdjson(stream(['\n\n{"ok":true}'])))out.push(value)
    expect(out).toEqual([{ok:true}])
  })
  it('rejects a missing stream body',async()=>{
    await expect(async()=>{for await(const _ of parseNdjson(null))void _}).rejects.toThrow()
  })
})
