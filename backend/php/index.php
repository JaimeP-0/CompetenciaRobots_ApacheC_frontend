<?php

declare(strict_types=1);

/**
 * API REST — Competencia de Robots
 * Subir la carpeta php/ al host (ej. public_html/api/) y apuntar la app a esa URL base.
 */

require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Response.php';

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    Response::json([
        'ok' => false,
        'error' => 'Falta config.php. Copia config.example.php como config.php.',
    ], 500);
}
$config = require $configPath;

Response::cors($config);
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = Database::pdo($config);
} catch (Throwable $e) {
    Response::json(['ok' => false, 'error' => 'Error de base de datos: ' . $e->getMessage()], 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/') ?: '/';

/** Quitar prefijo si el API vive en /api (ajusta según tu host). */
$basePrefixes = ['/api', '/backend/php', '/php'];
foreach ($basePrefixes as $prefix) {
    if (str_starts_with($path, $prefix)) {
        $path = substr($path, strlen($prefix)) ?: '/';
        break;
    }
}

$query = $_GET;
$body = Response::body();

// —— Rutas ——————————————————————————————————————————————————————————

if ($method === 'GET' && $path === '/health') {
    Response::json(['ok' => true, 'service' => 'competencia-robots-api', 'time' => date('c')]);
}

if ($method === 'POST' && $path === '/login') {
    handleLogin($pdo, $config, $body);
}

if ($method === 'GET' && $path === '/categorias') {
    Response::json(fetchCategorias($pdo));
}

if ($method === 'POST' && $path === '/categorias') {
    Response::json(createCategoria($pdo, $body), 201);
}

if (preg_match('#^/categorias/(\d+)$#', $path, $m)) {
    $catId = (int) $m[1];
    if ($method === 'PUT' || $method === 'PATCH') {
        Response::json(updateCategoria($pdo, $catId, $body));
    }
    if ($method === 'DELETE') {
        deleteCategoria($pdo, $catId);
        Response::json(['ok' => true]);
    }
}

if (preg_match('#^/categorias/(\d+)/reglas$#', $path, $m) && $method === 'POST') {
    Response::json(createRegla($pdo, (int) $m[1], $body), 201);
}

if (preg_match('#^/categorias/(\d+)/reglas/(\d+)$#', $path, $m)) {
    $catId = (int) $m[1];
    $reglaId = (int) $m[2];
    if ($method === 'PUT' || $method === 'PATCH') {
        Response::json(updateRegla($pdo, $catId, $reglaId, $body));
    }
    if ($method === 'DELETE') {
        deleteRegla($pdo, $catId, $reglaId);
        Response::json(['ok' => true]);
    }
}

if ($method === 'GET' && $path === '/registro') {
    Response::json(fetchRegistro($pdo, $query));
}

if (preg_match('#^/registro/(\d+)$#', $path, $m)) {
    $teamId = (int) $m[1];
    if ($method === 'PATCH' || $method === 'PUT') {
        Response::json(updateEquipoCategoria($pdo, $teamId, $body));
    }
}

if ($method === 'POST' && ($path === '/registro/validar' || $path === '/registro')) {
    Response::json(validarRegistro($pdo, $body));
}

if ($method === 'GET' && $path === '/validaciones') {
    Response::json(fetchValidaciones($pdo, $query));
}

Response::error('Ruta no encontrada: ' . $method . ' ' . $path, 404);

// —— Handlers ———————————————————————————————————————————————————————

function handleLogin(PDO $pdo, array $config, array $body): void
{
    $usuario = trim((string) ($body['usuario'] ?? $body['user'] ?? ''));
    $password = (string) ($body['password'] ?? $body['pass'] ?? '');
    if ($usuario === '' || $password === '') {
        Response::error('Usuario y contraseña requeridos', 400);
    }

    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1');
    $stmt->execute([$usuario]);
    $row = $stmt->fetch();

    $ok = false;
    if ($row && password_verify($password, $row['password_hash'])) {
        $ok = true;
    } elseif (!empty($config['demo_login']['enabled'])) {
        $demo = $config['demo_login'];
        $ok = $usuario === ($demo['usuario'] ?? 'admin') && $password === ($demo['password'] ?? 'admin');
    }

    if (!$ok) {
        Response::error('Usuario o contraseña incorrectos', 401);
    }

    Response::json([
        'ok' => true,
        'token' => bin2hex(random_bytes(16)),
        'usuario' => $usuario,
        'rol' => 'admin',
    ]);
}

function fetchCategorias(PDO $pdo): array
{
    $cats = $pdo->query('SELECT id, name FROM categories ORDER BY id')->fetchAll();
    $rulesStmt = $pdo->query('SELECT id, category_id, description FROM rules ORDER BY sort_order, id');
    $rulesByCat = [];
    foreach ($rulesStmt->fetchAll() as $r) {
        $cid = (int) $r['category_id'];
        $rulesByCat[$cid][] = [
            'id' => (int) $r['id'],
            'description' => $r['description'],
        ];
    }
    $items = [];
    foreach ($cats as $c) {
        $id = (int) $c['id'];
        $items[] = [
            'id' => $id,
            'name' => $c['name'],
            'rules' => $rulesByCat[$id] ?? [],
        ];
    }
    return $items;
}

function createCategoria(PDO $pdo, array $body): array
{
    $name = trim((string) ($body['name'] ?? ''));
    if ($name === '') {
        Response::error('name requerido', 400);
    }
    $stmt = $pdo->prepare('INSERT INTO categories (name) VALUES (?)');
    $stmt->execute([$name]);
    return ['id' => (int) $pdo->lastInsertId(), 'name' => $name, 'rules' => []];
}

function updateCategoria(PDO $pdo, int $id, array $body): array
{
    $name = trim((string) ($body['name'] ?? ''));
    if ($name === '') {
        Response::error('name requerido', 400);
    }
    $stmt = $pdo->prepare('UPDATE categories SET name = ? WHERE id = ?');
    $stmt->execute([$name, $id]);
    if ($stmt->rowCount() === 0) {
        Response::error('Categoría no encontrada', 404);
    }
    return ['id' => $id, 'name' => $name];
}

function deleteCategoria(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('DELETE FROM categories WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        Response::error('Categoría no encontrada', 404);
    }
}

function createRegla(PDO $pdo, int $catId, array $body): array
{
    $desc = trim((string) ($body['description'] ?? ''));
    if ($desc === '') {
        Response::error('description requerido', 400);
    }
    $stmt = $pdo->prepare('INSERT INTO rules (category_id, description) VALUES (?, ?)');
    $stmt->execute([$catId, $desc]);
    return ['id' => (int) $pdo->lastInsertId(), 'category_id' => $catId, 'description' => $desc];
}

function updateRegla(PDO $pdo, int $catId, int $reglaId, array $body): array
{
    $desc = trim((string) ($body['description'] ?? ''));
    if ($desc === '') {
        Response::error('description requerido', 400);
    }
    $stmt = $pdo->prepare('UPDATE rules SET description = ? WHERE id = ? AND category_id = ?');
    $stmt->execute([$desc, $reglaId, $catId]);
    if ($stmt->rowCount() === 0) {
        Response::error('Regla no encontrada', 404);
    }
    return ['id' => $reglaId, 'category_id' => $catId, 'description' => $desc];
}

function deleteRegla(PDO $pdo, int $catId, int $reglaId): void
{
    $stmt = $pdo->prepare('DELETE FROM rules WHERE id = ? AND category_id = ?');
    $stmt->execute([$reglaId, $catId]);
    if ($stmt->rowCount() === 0) {
        Response::error('Regla no encontrada', 404);
    }
}

function fetchRegistro(PDO $pdo, array $query): array
{
    $page = max(1, (int) ($query['page'] ?? 1));
    /** Sin limit (o limit=0): devuelve todos los equipos. Con limit>0: paginación. */
    $limitRaw = isset($query['limit']) ? (int) $query['limit'] : 0;
    $limit = $limitRaw > 0 ? max(1, min(100, $limitRaw)) : 0;
    $q = trim((string) ($query['q'] ?? ''));
    $catId = isset($query['category_id']) && $query['category_id'] !== ''
        ? (int) $query['category_id']
        : null;

    $where = ['1=1'];
    $params = [];
    if ($q !== '') {
        $where[] = '(t.name LIKE ? OR t.school LIKE ? OR t.teacher LIKE ?)';
        $like = '%' . $q . '%';
        $params = array_merge($params, [$like, $like, $like]);
    }
    if ($catId !== null && $catId > 0) {
        $where[] = 't.category_id = ?';
        $params[] = $catId;
    }
    $excludeValidated = in_array((string) ($query['exclude_validated'] ?? ''), ['1', 'true', 'yes'], true);
    if ($excludeValidated) {
        $where[] = 't.id NOT IN (
            SELECT v.team_id FROM validations v
            INNER JOIN (
                SELECT team_id, MAX(id) AS max_vid FROM validations GROUP BY team_id
            ) lv ON lv.team_id = v.team_id AND v.id = lv.max_vid
        )';
    }
    $whereSql = implode(' AND ', $where);

    $countStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM teams t WHERE $whereSql");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetch()['c'];

    $sql = "SELECT t.id, t.name, t.school, t.grade, t.teacher, t.category_id
            FROM teams t WHERE $whereSql ORDER BY t.id";
    if ($limit > 0) {
        $offset = ($page - 1) * $limit;
        $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $teams = $stmt->fetchAll();

    $memberStmt = $pdo->query('SELECT id, team_id, name, email, is_leader FROM team_members ORDER BY id');
    $membersByTeam = [];
    foreach ($memberStmt->fetchAll() as $m) {
        $tid = (int) $m['team_id'];
        $membersByTeam[$tid][] = [
            'id' => (int) $m['id'],
            'name' => $m['name'],
            'email' => $m['email'],
            'is_leader' => (bool) $m['is_leader'],
            'team_id' => $tid,
        ];
    }

    $items = [];
    foreach ($teams as $t) {
        $tid = (int) $t['id'];
        $items[] = [
            'id' => $tid,
            'name' => $t['name'],
            'school' => $t['school'],
            'grade' => $t['grade'],
            'teacher' => $t['teacher'],
            'category_id' => $t['category_id'] !== null ? (int) $t['category_id'] : null,
            'members' => $membersByTeam[$tid] ?? [],
        ];
    }

    if ($limit > 0) {
        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }
    return $items;
}

function updateEquipoCategoria(PDO $pdo, int $teamId, array $body): array
{
    $catRaw = $body['category_id'] ?? null;
    $catId = ($catRaw === null || $catRaw === '') ? null : (int) $catRaw;
    $stmt = $pdo->prepare('UPDATE teams SET category_id = ? WHERE id = ?');
    $stmt->execute([$catId, $teamId]);
    if ($stmt->rowCount() === 0) {
        Response::error('Equipo no encontrado', 404);
    }
    return ['ok' => true, 'id' => $teamId, 'category_id' => $catId];
}

function validarRegistro(PDO $pdo, array $body): array
{
    $teamId = (int) ($body['team_id'] ?? 0);
    if ($teamId <= 0) {
        Response::error('team_id requerido', 400);
    }
    $pass = !empty($body['pass']);
    if ($pass) {
        $chk = $pdo->prepare(
            'SELECT v.pass FROM validations v WHERE v.team_id = ? ORDER BY v.id DESC LIMIT 1'
        );
        $chk->execute([$teamId]);
        $last = $chk->fetch();
        if ($last) {
            Response::error('Este equipo ya tiene una verificación registrada.', 409);
        }
    }
    $stmt = $pdo->prepare('INSERT INTO validations (team_id, pass, payload_json) VALUES (?, ?, ?)');
    $stmt->execute([
        $teamId,
        $pass ? 1 : 0,
        json_encode($body, JSON_UNESCAPED_UNICODE),
    ]);
    return [
        'ok' => true,
        'mensaje' => 'Verificación registrada',
        'id' => (int) $pdo->lastInsertId(),
        'payload' => $body,
    ];
}

/**
 * Equipos con su última verificación (por defecto solo pass=1).
 * Query: pass (0|1), q, category_id, page, limit (0 = todos).
 */
function fetchValidaciones(PDO $pdo, array $query): array
{
    $onlyPass = !in_array((string) ($query['pass'] ?? '1'), ['0', 'false', 'no'], true);
    $page = max(1, (int) ($query['page'] ?? 1));
    $limitRaw = isset($query['limit']) ? (int) $query['limit'] : 0;
    $limit = $limitRaw > 0 ? max(1, min(100, $limitRaw)) : 0;
    $q = trim((string) ($query['q'] ?? ''));
    $catId = isset($query['category_id']) && $query['category_id'] !== ''
        ? (int) $query['category_id']
        : null;

    $where = ['1=1'];
    $params = [];
    if ($onlyPass) {
        $where[] = 'v.pass = 1';
    }
    if ($q !== '') {
        $where[] = '(t.name LIKE ? OR t.school LIKE ? OR t.teacher LIKE ?)';
        $like = '%' . $q . '%';
        $params = array_merge($params, [$like, $like, $like]);
    }
    if ($catId !== null && $catId > 0) {
        $where[] = 't.category_id = ?';
        $params[] = $catId;
    }
    $whereSql = implode(' AND ', $where);

    $baseFrom = 'FROM teams t
        INNER JOIN (
            SELECT team_id, MAX(id) AS max_vid
            FROM validations
            GROUP BY team_id
        ) lv ON lv.team_id = t.id
        INNER JOIN validations v ON v.id = lv.max_vid
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE ' . $whereSql;

    $countStmt = $pdo->prepare('SELECT COUNT(*) AS c ' . $baseFrom);
    $countStmt->execute($params);
    $total = (int) $countStmt->fetch()['c'];

    $sql = 'SELECT t.id, t.name, t.school, t.grade, t.teacher, t.category_id,
            c.name AS category_name,
            v.id AS validation_id, v.pass, v.created_at AS validated_at '
        . $baseFrom
        . ' ORDER BY v.created_at DESC, t.name ASC';
    if ($limit > 0) {
        $offset = ($page - 1) * $limit;
        $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $memberStmt = $pdo->query('SELECT team_id, name, is_leader FROM team_members ORDER BY id');
    $captainByTeam = [];
    foreach ($memberStmt->fetchAll() as $m) {
        $tid = (int) $m['team_id'];
        if (!empty($m['is_leader'])) {
            $captainByTeam[$tid] = $m['name'];
        } elseif (!isset($captainByTeam[$tid])) {
            $captainByTeam[$tid] = $m['name'];
        }
    }

    $items = [];
    foreach ($rows as $r) {
        $tid = (int) $r['id'];
        $items[] = [
            'id' => $tid,
            'name' => $r['name'],
            'school' => $r['school'],
            'grade' => $r['grade'],
            'teacher' => $r['teacher'],
            'category_id' => $r['category_id'] !== null ? (int) $r['category_id'] : null,
            'category_name' => $r['category_name'],
            'captain_name' => $captainByTeam[$tid] ?? null,
            'validation_id' => (int) $r['validation_id'],
            'pass' => (bool) $r['pass'],
            'validated_at' => $r['validated_at'],
        ];
    }

    if ($limit > 0) {
        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }
    return ['items' => $items, 'total' => $total];
}
