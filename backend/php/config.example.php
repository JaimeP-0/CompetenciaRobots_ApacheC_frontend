<?php
/**
 * Copia este archivo como config.php en el mismo directorio y edita los valores.
 * No subas config.php con contraseñas reales a repositorios públicos.
 */
return [
    'db' => [
        'host' => 'srv766.hstgr.io',
        'port' => 3306,
        'name' => 'u489282276_torneo_robots',
        'user' => 'u489282276_torneoadmin',
        'pass' => 'p7bGfgDQo0;',
        'charset' => 'utf8mb4',
    ],
    'cors' => [
        'allowed_origins' => ['*'],
    ],
    /** Credenciales demo si aún no hay fila en admin_users (quitar en producción). */
    'demo_login' => [
        'enabled' => true,
        'usuario' => 'admin',
        'password' => 'admin',
    ],
];
