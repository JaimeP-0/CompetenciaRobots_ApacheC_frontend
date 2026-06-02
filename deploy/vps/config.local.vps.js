/**
 * Config en el VPS: front y API en el mismo host (nginx :80 → Go :8080).
 * publicUrl: URL pública para APK Android (mismo host, sin :8080).
 */
(function (w) {
    'use strict';
    w.CR_API_OVERRIDES = {
        apiProfile: 'vps',
        publicUrl: 'https://utarena.online',
        adminLoginMock: false,
        diagFeedKey: 'cr-diag-utarena-x7k9m2'
    };
})(window);
