// https://poe-bundles.snos.workers.dev

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest (event) {
  try {
    const cdnPath = new URL(event.request.url).pathname

    const proxiedUrl = (cdnPath === '/schema.min.json')
      ? 'https://github.com/poe-tool-dev/dat-schema/releases/download/latest/schema.min.json'
      : cdnPath.startsWith('/4.')
        ? `https://patch-poe2.poecdn.com${cdnPath}`
        : `https://patch.poecdn.com${cdnPath}`

    const response = await fetch(proxiedUrl, {
      headers: event.request.headers
    })
    const headers = changeResponseHeaders(response)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  } catch (err) {
    return new Response(err.stack || err)
  }
}

function changeResponseHeaders (response) {
  const headers = new Headers()
  headers.set('content-length', response.headers.get('content-length'))
  headers.set('accept-ranges', 'bytes')
  headers.set('content-type', 'application/octet-stream')
  if (response.headers.has('content-range')) {
    headers.set('content-range', response.headers.get('content-range'))
  }
  headers.set('cache-control', 'max-age=0, no-cache, no-store')
  headers.set('access-control-allow-origin', '*')
  return headers
}
