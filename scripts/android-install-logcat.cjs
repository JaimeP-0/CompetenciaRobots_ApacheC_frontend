/**
 * Limpia la plataforma Android, prepara el proyecto, compila, instala (cordova run android)
 * y deja corriendo adb logcat hasta que pulses Ctrl+C.
 *
 * Por defecto ejecuta `cordova clean android` antes de preparar/compilar para evitar APK
 * o manifiestos en mal estado (p. ej. INSTALL_PARSE_FAILED).
 * CR_SKIP_CLEAN=1 — no ejecutar clean (más rápido, más riesgo de caché corrupta).
 * CR_SKIP_PREPARE=1 — no ejecutar npm run prepare:all (solo clean + run).
 *
 * Requisitos: Android SDK (adb en PATH), un dispositivo/emulador conectado, USB depuración.
 * Un solo dispositivo: si hay varios, define ANDROID_SERIAL (ver `adb devices`).
 */
'use strict';

var path = require('path');
var fs = require('fs');
var { spawnSync, spawn, execSync } = require('child_process');

var ROOT = path.join(__dirname, '..');
var PACKAGE = 'com.cr.competenciarobots';

function log(msg) {
    process.stderr.write('[android-install-logcat] ' + msg + '\n');
}

function runCordovaCleanAndroid() {
    var androidDir = path.join(ROOT, 'platforms', 'android');
    if (!fs.existsSync(androidDir)) {
        log('Sin platforms/android todavía; se omite clean hasta el primer prepare.');
        return;
    }
    log('Limpiando plataforma Android (npx cordova clean android)…');
    var r = spawnSync('npx', ['cordova', 'clean', 'android'], {
        cwd: ROOT,
        stdio: 'inherit',
        shell: true,
        env: process.env
    });
    if (r.error) {
        throw r.error;
    }
    if (r.status !== 0) {
        log('Error: cordova clean android falló (código ' + r.status + '). Revisa Gradle o cierra Android Studio.');
        process.exit(r.status || 1);
    }
}

function runCordovaRunAndroid() {
    log('Compilando e instalando (npx cordova run android)…');
    var r = spawnSync('npx', ['cordova', 'run', 'android'], {
        cwd: ROOT,
        stdio: 'inherit',
        shell: true,
        env: process.env
    });
    if (r.error) {
        throw r.error;
    }
    if (r.status !== 0) {
        process.exit(r.status || 1);
    }
}

function sleepSync(ms) {
    var end = Date.now() + ms;
    while (Date.now() < end) {
        /* espera activa breve para dar tiempo al proceso tras cold start */
    }
}

function getAppPid() {
    try {
        var out = execSync('adb shell pidof -s ' + PACKAGE, {
            encoding: 'utf8',
            cwd: ROOT,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        var pid = String(out || '')
            .trim()
            .split(/\s+/)[0];
        return /^\d+$/.test(pid) ? pid : null;
    } catch (e) {
        return null;
    }
}

function runLogcatUntilCancel() {
    sleepSync(800);
    var pid = getAppPid();
    var args;
    if (pid) {
        log('Filtrando logcat por PID del proceso: ' + pid + ' (' + PACKAGE + ')');
        args = ['logcat', '-v', 'time', '--pid', pid];
    } else {
        log('No se obtuvo PID (pidof); logcat con etiquetas WebView/Cordova (menos ruido).');
        args = [
            'logcat',
            '-v',
            'time',
            'CordovaLog:I',
            'chromium:I',
            'SystemWebViewClient:I',
            'ActivityManager:I',
            '*:S'
        ];
    }

    log('Logcat en marcha. Pulsa Ctrl+C para salir.\n');
    var child = spawn('adb', args, {
        cwd: ROOT,
        stdio: 'inherit',
        shell: false,
        env: process.env
    });
    function die() {
        try {
            child.kill('SIGTERM');
        } catch (ignore) {}
        process.exit(0);
    }
    process.on('SIGINT', die);
    process.on('SIGTERM', die);
    child.on('close', function (code) {
        process.exit(code === 0 || code === null ? 0 : code);
    });
}

function main() {
    var skipClean = process.env.CR_SKIP_CLEAN === '1' || process.env.CR_SKIP_CLEAN === 'true';
    var skipPrepare = process.env.CR_SKIP_PREPARE === '1' || process.env.CR_SKIP_PREPARE === 'true';

    if (!skipClean) {
        runCordovaCleanAndroid();
    } else {
        log('Omitiendo clean (CR_SKIP_CLEAN=1).');
    }

    if (!skipPrepare) {
        log('Ejecutando npm run prepare:all (CR_SKIP_PREPARE=1 para omitir; CR_SKIP_CLEAN=1 para omitir clean)…');
        var prep = spawnSync('npm', ['run', 'prepare:all'], {
            cwd: ROOT,
            stdio: 'inherit',
            shell: true,
            env: process.env
        });
        if (prep.status !== 0) {
            process.exit(prep.status || 1);
        }
    } else {
        log('Omitiendo prepare:all (CR_SKIP_PREPARE=1).');
    }

    runCordovaRunAndroid();
    try {
        spawnSync('adb', ['logcat', '-c'], { cwd: ROOT, stdio: 'ignore', shell: true });
    } catch (ignore) {}
    runLogcatUntilCancel();
}

main();
