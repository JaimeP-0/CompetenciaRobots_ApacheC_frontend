'use strict';

/**
 * Tras prepare: run.js del browser con proxy /api para cordova run browser.
 */
module.exports = function (context) {
    const fs = require('fs');
    const path = require('path');
    const root = context.opts.projectRoot;
    const src = path.join(root, 'res', 'native', 'browser', 'run.js');
    const dest = path.join(root, 'platforms', 'browser', 'cordova', 'lib', 'run.js');

    if (!fs.existsSync(src)) {
        return;
    }
    if (!fs.existsSync(path.dirname(dest))) {
        return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
};
