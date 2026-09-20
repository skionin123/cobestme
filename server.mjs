import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'dist')
const port = Number(process.env.PORT || 4173)
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2'
}

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    const safePath = normalize(urlPath).replace(/^([.][.][/\\])+/, '')
    let filePath = join(root, safePath === '/' ? 'index.html' : safePath)
    try {
      const info = await stat(filePath)
      if (info.isDirectory()) filePath = join(filePath, 'index.html')
    } catch {
      filePath = join(root, 'index.html')
    }
    const body = await readFile(filePath)
    res.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream' })
    res.end(body)
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Server error')
  }
}).listen(port, '0.0.0.0', () => console.log(`CoBest listening on ${port}`))
