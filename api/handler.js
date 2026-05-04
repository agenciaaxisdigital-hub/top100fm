// Vercel Node.js serverless function — bridges Web Fetch API to Node.js req/res.
// dist/server/server.js is included via vercel.json "includeFiles".
import { Readable } from 'node:stream'
import server from '../dist/server/server.js'

export default async function handler(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost'
  const url = new URL(req.url, `${proto}://${host}`)

  const headers = new Headers()
  for (const [key, val] of Object.entries(req.headers)) {
    if (val === undefined) continue
    if (Array.isArray(val)) {
      for (const v of val) headers.append(key, v)
    } else {
      headers.set(key, val)
    }
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)

  const webReq = new Request(url, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method?.toUpperCase()) || chunks.length === 0
      ? undefined
      : Buffer.concat(chunks),
    duplex: 'half',
  })

  const webRes = await server.fetch(webReq)

  res.statusCode = webRes.status
  res.statusMessage = webRes.statusText || ''

  for (const [key, value] of webRes.headers.entries()) {
    res.setHeader(key, value)
  }

  if (webRes.body) {
    Readable.fromWeb(webRes.body).pipe(res)
  } else {
    res.end()
  }
}
