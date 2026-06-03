<?php
/**
 * Auto-login a Postgres. Protegido por nginx auth_basic en la ruta oculta.
 * Credenciales vía env: ADMINER_DB_SERVER, ADMINER_DB_USER, ADMINER_DB_PASSWORD, ADMINER_DB_NAME.
 */
class AdminerCrAutoLogin {
    private function cfg($key, $fallback) {
        $val = getenv($key);
        return ($val !== false && $val !== '') ? $val : $fallback;
    }

    function __construct() {
        if (!empty($_POST['auth']) || !empty($_POST['logout'])) {
            return;
        }

        $server = $this->cfg('ADMINER_DB_SERVER', 'robot-postgres');
        $user = $this->cfg('ADMINER_DB_USER', 'robot');
        $pass = $this->cfg('ADMINER_DB_PASSWORD', 'robot');
        $db = $this->cfg('ADMINER_DB_NAME', 'robot');

        set_password('pgsql', $server, $user, $pass);
        $_SESSION['db']['pgsql'][$server][$user][$db] = true;

        if (empty($_GET['pgsql'])) {
            $_GET['pgsql'] = $server;
        }
        if (empty($_GET['username'])) {
            $_GET['username'] = $user;
        }
        if (!isset($_GET['db']) || $_GET['db'] === '') {
            $_GET['db'] = $db;
        }
    }

    function credentials() {
        return array(
            $this->cfg('ADMINER_DB_SERVER', 'robot-postgres'),
            $this->cfg('ADMINER_DB_USER', 'robot'),
            $this->cfg('ADMINER_DB_PASSWORD', 'robot'),
        );
    }

    function database() {
        return $this->cfg('ADMINER_DB_NAME', 'robot');
    }

    function login($login, $password) {
        return true;
    }
}

return new AdminerCrAutoLogin;
