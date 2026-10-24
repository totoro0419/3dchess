export async function* parseNdjson<T>(body: ReadableStream<Uint8Array> | null): AsyncGenerator<T> {
  if (!body) throw new Error('Expected a streaming response body')
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const raw of lines) {
        const line = raw.trim()
        if (line) yield JSON.parse(line) as T
      }
    }
    buffer += decoder.decode()
    const tail = buffer.trim()
    if (tail) yield JSON.parse(tail) as T
  } finally {
    reader.releaseLock()
  }
}
