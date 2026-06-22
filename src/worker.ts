export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/random') {
      return handleRandom()
    }

    return new Response('Not found', { status: 404 })
  },
}

function handleRandom(): Response {
  const value = Math.floor(Math.random() * 1000)
  const payload = { value, generatedAt: new Date().toISOString() }

  return new Response(JSON.stringify(payload), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
