const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/random') {
      return handleRandom(request)
    }

    return jsonResponse({ error: 'Not found' }, { status: 404 })
  },
}

function handleRandom(request: Request): Response {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: JSON_HEADERS })
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
  }

  const value = Math.floor(Math.random() * 1000)
  const payload = { value, generatedAt: new Date().toISOString() }

  return jsonResponse(payload, { body: request.method === 'HEAD' ? null : undefined })
}

function jsonResponse(payload: unknown, init: ResponseInit & { body?: BodyInit | null } = {}): Response {
  const { body, headers, ...responseInit } = init
  const responseHeaders = new Headers(JSON_HEADERS)

  new Headers(headers).forEach((value, key) => {
    responseHeaders.set(key, value)
  })

  return new Response(body === undefined ? JSON.stringify(payload) : body, {
    ...responseInit,
    headers: responseHeaders,
  })
}
