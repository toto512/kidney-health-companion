// Minimal static server for the site files in the repo root. No dependencies.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
// Mirror of the "Stage publishable files only" step in .github/workflows/pages.yml.
const PUBLISHED_FILES = new Set(['index.html', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', 'sw.js']);
const PUBLISHED_DIRS = ['js/', 'data/', 'guides/'];
const published = (p) => PUBLISHED_FILES.has(p) || PUBLISHED_DIRS.some((d) => p.startsWith(d) && !p.includes('..'));
const types = { '.html': 'text/html', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.js': 'text/javascript', '.json': 'application/json' };
const port = Number(process.env.PORT || 4173);

http.createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[/\\]+/, '') || 'index.html';
  // Serve only files the Pages workflow publishes, so tests see what production sees.
  if (!published(path.replaceAll('\\', '/'))) { res.writeHead(404).end('not found'); return; }
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on :${port}`));
