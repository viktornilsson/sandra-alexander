/* Liten statisk server för att titta på dist/ lokalt.
   Kör med: npm run dev   →   http://localhost:4173 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = 4173;

const TYPER = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const fil = path.join(DIST, rel);

  // Ingen väg ut ur dist/.
  if (!fil.startsWith(DIST)) {
    res.writeHead(403).end('Nej.');
    return;
  }

  try {
    const data = await fs.readFile(fil);
    res.writeHead(200, { 'Content-Type': TYPER[path.extname(fil)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Hittades inte');
  }
}).listen(PORT, () => {
  console.log(`Sidan ligger på http://localhost:${PORT}`);
});
