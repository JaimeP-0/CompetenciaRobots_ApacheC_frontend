'use strict';

/**
 * Proxy Express: /categorias, /equipos, … → backend (mismas rutas, sin /api).
 * Usado por cordova run browser (res/native/browser/run.js).
 */
const express = require('express');
const httpProxy = require('http-proxy');
const { isApiRoute } = require('./api-proxy-paths.cjs');

const DEFAULT_API = 'http://100.124.252.101:8080';
const API_TARGET = (process.env.CR_API_TARGET || DEFAULT_API).replace(/\/$/, '');
const IS_HTTPS = API_TARGET.indexOf('https://') === 0;

const proxy = httpProxy.createProxyServer({
    target: API_TARGET,
    changeOrigin: true,
    secure: IS_HTTPS
});

proxy.on('error', function (err, req, res) {
    if (res && !res.headersSent) {
        res.status(502).type('text/plain; charset=utf-8');
    }
    if (res && !res.writableEnded) {
        res.end(
            'Proxy API error: ' +
                (err && err.message ? err.message : 'unknown') +
                '\nDestino: ' +
                API_TARGET
        );
    }
});

function createRouter() {
    const router = express.Router();
    router.use(function (req, res, next) {
        if (isApiRoute(req.path)) {
            proxy.web(req, res);
            return;
        }
        next();
    });
    return router;
}

module.exports = { createRouter: createRouter, API_TARGET: API_TARGET };
