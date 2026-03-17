// Browser test runner: serves files, runs headless Chromium, captures tst output
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' }

const server = createServer(async (req, res) => {
  try {
    let body = await readFile(resolve(root, '.' + req.url.split('?')[0]))
    res.writeHead(200, { 'content-type': mime[extname(req.url.split('?')[0])] || 'text/plain' })
    res.end(body)
  } catch {
    res.writeHead(404); res.end()
  }
})

server.listen(0, async () => {
  let { chromium } = await import('@playwright/test')
  let browser = await chromium.launch()
  let page = await browser.newPage()

  let fail = false
  page.on('console', m => {
    let t = m.type(), s = m.text().replace(/%c/g, '').replace(/color: #[0-9a-f]+/gi, '').trim()
    if (!s || t === 'endGroup') return
    if (t === 'startGroup') s = `► ${s}`
    else if (t === 'assert') s = `  ✗ ${s}`
    console.log(s)
    if (s.includes('# fail')) fail = true
  })

  await page.goto(`http://localhost:${server.address().port}/test/browser.html`)
  await page.waitForFunction(() => window.__tst_done, { timeout: 30000 })
  await new Promise(r => setTimeout(r, 100)) // let console callbacks flush
  await browser.close()
  server.close()
  process.exitCode = fail ? 1 : 0
})
