'use strict';

/**
 * Proxy Express /api/* → backend PHP (Hostinger por defecto).
 * Usado por cordova run browser (res/native/browser/run.js).
 *
 * Si ves 502 hacia 100.124.252.101, borra la variable de entorno:
 *   PowerShell: Remove-Item Env:CR_API_TARGET
 */
const express = require('express');
const httpProxy = require('http-proxy');

const DEFAULT_API = 'https://dimgrey-ibex-191607.hostingersite.com/api';
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
                API_TARGET +
                '\nSi no es Hostinger, ejecuta: Remove-Item Env:CR_API_TARGET'
        );
    }
});

function createRouter() {
    const router = express.Router();
    router.use('/api', function (req, res) {
        var url = req.url || '';
        req.url = url.replace(/^\/api/, '') || '/';
        proxy.web(req, res);
    });
    return router;
}

module.exports = { createRouter: createRouter, API_TARGET: API_TARGET };
