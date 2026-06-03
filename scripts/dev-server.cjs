'use strict';

/**
 * Servidor de desarrollo: proxy de rutas API (/categorias, /equipos, …) → backend.
 * Mismas rutas que en producción, sin prefijo /api (evita CORS en el navegador).
 *
 * Uso recomendado (equivale a cordova run browser + API):
 *   npm run browser   →  prepare browser + este servidor + cordova.js/plugins
 *
 * Solo estáticos (sin proxy, sin API en Network):
 *   cordova run browser   ← no uses esto si necesitas /registro
 *
 * Variable CR_API_TARGET (opcional): por defecto API Go local (127.0.0.1:8080).
 * Ver .env.example y npm run local
 * Variable CR_WWW_ROOT: carpeta a servir (por defecto platforms/browser/www si existe)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const httpProxy = require('http-proxy');
const { isApiRoute, API_ROUTE_PREFIXES } = require('./api-proxy-paths.cjs');
const { getApiTarget } = require('./local-api.cjs');

const PORT = Number(process.env.PORT || 8000);
const API_TARGET = getApiTarget();
const projectRoot = path.join(__dirname, '..');
const browserWww = path.join(projectRoot, 'platforms', 'browser', 'www');
const defaultWww = path.join(projectRoot, 'www');
const WWW = process.env.CR_WWW_ROOT
    ? path.resolve(process.env.CR_WWW_ROOT)
    : fs.existsSync(path.join(browserWww, 'index.html'))
      ? browserWww
      : defaultWww;
const shouldOpen = process.argv.indexOf('--open') !== -1;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff'
};

const proxy = httpProxy.createProxyServer({
    target: API_TARGET,
    changeOrigin: true,
    secure: API_TARGET.indexOf('https://') === 0
});

proxy.on('error', function (err, req, res) {
    if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Proxy error: ' + (err && err.message ? err.message : 'unknown'));
});

function safePath(urlPath) {
    var p = decodeURIComponent(String(urlPath || '/').split('?')[0]);
    if (p === '/') {
        return '/index.html';
    }
    var normalized = path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, '');
    if (normalized.startsWith('..')) {
        return null;
    }
    return normalized;
}

function serveStatic(req, res) {
    var rel = safePath(req.url);
    if (!rel) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    var filePath = path.join(WWW, rel);
    fs.stat(filePath, function (err, stat) {
        if (err || !stat.isFile()) {
            if (rel !== '/index.html') {
                filePath = path.join(WWW, 'index.html');
                fs.stat(filePath, function (err2, stat2) {
                    if (err2 || !stat2.isFile()) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }
                    sendFile(filePath, res);
                });
                return;
            }
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        sendFile(filePath, res);
    });
}

function sendFile(filePath, res) {
    var ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, function (err, data) {
        if (err) {
            res.writeHead(500);
            res.end('Error');
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

const server = http.createServer(function (req, res) {
    if (req.url && isApiRoute(req.url)) {
        proxy.web(req, res);
        return;
    }
    serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', function () {
    var url = 'http://localhost:' + PORT + '/';
    console.log('');
    console.log('CR dev server: ' + url);
    console.log('  www:   ' + WWW);
    console.log('  proxy: ' + API_ROUTE_PREFIXES.join(', ') + ' → ' + API_TARGET);
    try {
        var os = require('os');
        var ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function (name) {
            ifaces[name].forEach(function (iface) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log('  LAN:   http://' + iface.address + ':' + PORT + '/');
                }
            });
        });
    } catch (e) {
        /* opcional */
    }
    console.log('');
    console.log('Abre la app por localhost o por la IP LAN de arriba (mismo puerto ' + PORT + ').');
    console.log('No uses "cordova run browser" a mano si necesitas API; usa "npm run browser".');
    console.log('Android (cordova run android) llama al backend directo, sin este proxy.');
    console.log('');
    if (shouldOpen) {
        var cmd =
            process.platform === 'win32'
                ? 'start "" "' + url + '"'
                : process.platform === 'darwin'
                  ? 'open "' + url + '"'
                  : 'xdg-open "' + url + '"';
        exec(cmd);
    }
});
