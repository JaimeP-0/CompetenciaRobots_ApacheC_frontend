'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const { getApiTarget, projectRoot } = require('./local-api.cjs');

process.env.CR_API_TARGET = getApiTarget();

const prep = spawnSync('npm', ['run', 'prepare:browser'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
    env: process.env
});
if (prep.status !== 0) {
    process.exit(prep.status || 1);
}

const args = [path.join(__dirname, 'dev-server.cjs')];
if (process.argv.indexOf('--open') !== -1) {
    args.push('--open');
}

const srv = spawnSync('node', args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: false,
    env: process.env
});
process.exit(srv.status || 0);
