#!/usr/bin/env node

/*
 * Servidor browser de Cordova + proxy /api (Tailscale) + fallback SPA.
 * Copiado a platforms/browser/cordova/lib/run.js en after_prepare.
 */

const fs = require('fs');
const path = require('path');
const url = require('url');
const express = require('express');
const cordovaServe = require('cordova-serve');
/** __dirname = platforms/browser/cordova/lib (tras copiar en prepare). */
const projectRoot = path.join(__dirname, '..', '..', '..', '..');
const apiProxy = require(path.join(projectRoot, 'scripts', 'cordova-browser-api-proxy.cjs'));
const createApiProxyRouter = apiProxy.createRouter;

/**
 * Rutas sin extensión sirven index.html (hash routing en el cliente).
 */
function createSpaFallbackRouter(wwwPath) {
    const router = express.Router();
    router.get('*', function (req, res, next) {
        if (req.method !== 'GET') {
            return next();
        }
        const p = req.path || '';
        if (p === '/' || p === '') {
            return next();
        }
        if (/\.[A-Za-z0-9]{1,10}$/.test(p)) {
            return next();
        }
        res.sendFile(path.join(wwwPath, 'index.html'));
    });
    return router;
}

function createDevRouters(wwwPath) {
    const router = express.Router();
    router.use(createApiProxyRouter());
    router.use(createSpaFallbackRouter(wwwPath));
    return router;
}

module.exports.run = function (args) {
    args.port = args.port || 8000;
    args.target = args.target || 'default';
    args.noLogOutput = args.silent || false;

    const wwwPath = path.join(__dirname, '../../www');
    const manifestFilePath = path.resolve(path.join(wwwPath, 'manifest.json'));

    let startPage;

    if (fs.existsSync(manifestFilePath)) {
        try {
            const manifest = require(manifestFilePath);
            startPage = manifest.start_url;
        } catch (err) {
            console.log('failed to require manifest ... ' + err);
        }
    }

    const server = cordovaServe();
    server
        .servePlatform('browser', {
            port: args.port,
            noServerInfo: true,
            noLogOutput: args.noLogOutput,
            router: createDevRouters(wwwPath)
        })
        .then(function () {
            if (!startPage) {
                startPage = 'index.html';
            }

            const rootUrl = new url.URL('http://localhost:' + server.port + '/').href;

            console.log('startPage = ' + startPage + ' (SPA + API proxy → ' + apiProxy.API_TARGET + ')');
            console.log('Static file server running @ ' + rootUrl + '\nCTRL + C to shut down');
            return server.launchBrowser({ target: args.target, url: rootUrl });
        })
        .catch(function (error) {
            console.log(error.message || error.toString());
            if (server.server) {
                server.server.close();
            }
        });
};
