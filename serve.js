/* خادم معاينة محلي — شغّله بالأمر:  node serve.js  */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const ROOT = __dirname; let port = 8130;

const TYPES = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.ico':'image/x-icon', '.webmanifest':'application/manifest+json; charset=utf-8' };

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const file = path.join(ROOT, path.normalize(rel).replace(/^[\\/]+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}).end('not found: ' + rel); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
                         'Cache-Control': 'no-store' });
    res.end(buf);
  });
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE' && port < 8150) { console.log('port ' + port + ' busy, trying ' + (port+1)); server.listen(++port); }
  else { console.error(e.message); process.exit(1); }
});

server.listen(port, () => {
  let lan = null;
  const nets = os.networkInterfaces();
  for (const n of Object.keys(nets)) { for (const i of nets[n]) { if (i.family === 'IPv4' && !i.internal) { lan = i.address; break; } } if (lan) break; }
  console.log('\n  Site running - Ctrl+Click to open\n');
  console.log('  PC:            http://localhost:' + port);
  if (lan) console.log('  Phone / iPad:  http://' + lan + ':' + port + '   (same Wi-Fi)');
  console.log('\n  Stop: Ctrl+C\n');
});
