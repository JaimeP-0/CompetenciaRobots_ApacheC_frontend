'use strict';

/**
 * URL por defecto del API Go local (cmd/server en repo Willyzsz/robot).
 * Sobrescribe con CR_API_TARGET en el entorno o .env en la raíz del proyecto.
 */
const path = require('path');
const fs = require('fs');

const LOCAL_API_URL = 'http://127.0.0.1:8080';
const REMOTE_API_URL = 'http://100.119.194.73:8080';

const projectRoot = path.join(__dirname, '..');

function loadDotEnv() {
    var envPath = path.join(projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }
    var text = fs.readFileSync(envPath, 'utf8');
    text.split(/\r?\n/).forEach(function (line) {
        var m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
        if (!m || line.trim().startsWith('#')) {
            return;
        }
        var val = m[2].replace(/^["']|["']$/g, '');
        if (process.env[m[1]] == null || process.env[m[1]] === '') {
            process.env[m[1]] = val;
        }
    });
}

function getApiTarget() {
    loadDotEnv();
    return (process.env.CR_API_TARGET || LOCAL_API_URL).replace(/\/$/, '');
}

function getApiProfile() {
    loadDotEnv();
    var p = (process.env.CR_API_PROFILE || 'local').toLowerCase();
    return p === 'remote' ? 'remote' : 'local';
}

function resolveRobotDir() {
    loadDotEnv();
    var dir = process.env.CR_ROBOT_DIR;
    if (dir) {
        return path.resolve(dir);
    }
    var sibling = path.join(projectRoot, '..', 'robot');
    if (fs.existsSync(path.join(sibling, 'go.mod'))) {
        return sibling;
    }
    return sibling;
}

module.exports = {
    LOCAL_API_URL: LOCAL_API_URL,
    REMOTE_API_URL: REMOTE_API_URL,
    projectRoot: projectRoot,
    loadDotEnv: loadDotEnv,
    getApiTarget: getApiTarget,
    getApiProfile: getApiProfile,
    resolveRobotDir: resolveRobotDir
};
