'use strict';

/**
 * Levanta Postgres (docker compose) y el API Go en el repo robot.
 * Requiere: Docker, Go, clone de https://github.com/Willyzsz/robot
 * Variable CR_ROBOT_DIR o carpeta ../robot junto a este proyecto.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { resolveRobotDir, LOCAL_API_URL, loadDotEnv } = require('./local-api.cjs');

loadDotEnv();

const robotDir = resolveRobotDir();
const envFile = path.join(robotDir, '.env');

function log(msg) {
    process.stderr.write('[local-api] ' + msg + '\n');
}

if (!fs.existsSync(path.join(robotDir, 'go.mod'))) {
    log('No se encontró el backend Go en: ' + robotDir);
    log('');
    log('Clónalo junto al proyecto Cordova:');
    log('  cd ..');
    log('  git clone https://github.com/Willyzsz/robot.git');
    log('');
    log('O define CR_ROBOT_DIR con la ruta al repo robot.');
    process.exit(1);
}

if (!fs.existsSync(envFile)) {
    log('Creando .env de ejemplo en ' + envFile);
    fs.writeFileSync(
        envFile,
        [
            'POSTGRES_USER=robot',
            'POSTGRES_PASSWORD=robot',
            'POSTGRES_DB=robot',
            'POSTGRES_PORT=5432',
            'POSTGRES_HOST=localhost',
            ''
        ].join('\n'),
        'utf8'
    );
}

function run(cmd, args, opts) {
    return spawn(cmd, args, Object.assign({ stdio: 'inherit', shell: true, cwd: robotDir }, opts || {}));
}

log('Carpeta robot: ' + robotDir);
log('Levantando Postgres (docker compose up -d)…');

const compose = run('docker', ['compose', 'up', '-d']);
compose.on('close', function (code) {
    if (code !== 0) {
        log('docker compose falló. ¿Está Docker en ejecución?');
        process.exit(code || 1);
    }
    log('Iniciando API Go en ' + LOCAL_API_URL + ' …');
    log('(Ctrl+C para detener el servidor)');
    const go = run('go', ['run', './cmd/server']);
    go.on('close', function (c) {
        process.exit(c || 0);
    });
});

compose.on('error', function (err) {
    log('Error: ' + (err && err.message ? err.message : err));
    process.exit(1);
});
