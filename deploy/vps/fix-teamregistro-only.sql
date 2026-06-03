-- Solo teamregistro: rol registro + contraseña del evento (41683 → hash en credenciales-evento.private.md).
-- No toca otros usuarios. Aplicar: npm run vps:fix-teamregistro

ALTER TABLE user_account DROP CONSTRAINT IF EXISTS chk_user_role;
ALTER TABLE user_account
    ADD CONSTRAINT chk_user_role
    CHECK (role IN ('juez', 'visitante', 'arbitro', 'admin', 'dev', 'registro'));

INSERT INTO user_account (username, name, role, password_hash)
VALUES (
    'teamregistro',
    'Registro de equipos',
    'registro',
    '$2b$10$IbfhtowlfDGlTmp/cZxX/u.4MrE7lYi/AZJEOhOyqY2CBLnJo0IOa'
)
ON CONFLICT (username) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

SELECT username, role, name, left(password_hash, 29) AS hash_ok
FROM user_account
WHERE username = 'teamregistro';
