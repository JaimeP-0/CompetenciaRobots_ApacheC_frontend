-- Seed completo de usuarios staff (evento UT Arena).
-- Referencia en claro: deploy/vps/credenciales-evento.private.md (no versionar).
-- Aplicar: npm run vps:users-seed
--
-- id | username           | nombre completo                              | rol       | password      | categoría | interno
-- ---+--------------------+----------------------------------------------+-----------+---------------+-----------+--------
--  1 | admin              | Administrador                                | admin     | adminrobots09 | —         | —
--  2 | dev                | Desarrollador                                | dev       | 47291         | —         | —
--  3 | visitante          | Visitante                                    | visitante | 63840         | —         | —
--  4 | guillermo.iglesias | Ing. Guillermo Elías Iglesias López          | juez      | 84821         | Minisumo  | no
--  5 | jesus.hernandez    | Ing. Jesús Arturo Hernández Soberón          | juez      | 51937         | Velocista | no
--  6 | alejandra.gonzales | Mtra. Alejandra González Miranda             | juez      | 26408         | Futbol    | no
--  7 | martha.sanchez     | Mtra. Martha Lilia Sánchez Sánchez          | juez      | 90315         | Minisumo  | sí
--  8 | raul.uranga        | Ing. Raúl Uranga Cruz                        | juez      | 17562         | Velocista | sí
--  9 | rogelio.galvan     | Mtro. Rogelio Galván Hernández               | juez      | 42088         | Futbol    | sí
-- 10 | rosendo.deluna     | Mtro. Rosendo de Luna Álvarez                | arbitro   | 73104         | Minisumo  | no
-- 11 | estela.salas       | Mtra. Estela Salas Siller                    | arbitro   | 58629         | Velocista | no
-- 12 | juan.serrano       | Ing. Juan Jaime Serrano Torres               | arbitro   | 29471         | Futbol    | no
-- 13 | manuel.zertuche    | Zertuche Ramírez Manuel Alonso 3B IEE        | arbitro   | 65013         | Minisumo  | sí
-- 14 | ximena.silva       | Silva García Ximena 3C IEE                   | arbitro   | 38256         | Velocista | sí
-- 15 | felix.macias       | Macías López Félix Emmanuel 3A IEE           | arbitro   | 91740         | Futbol    | sí
-- 16 | teamregistro       | Registro de equipos                          | registro  | 41683         | —         | —

ALTER TABLE user_account DROP CONSTRAINT IF EXISTS chk_user_role;
ALTER TABLE user_account
    ADD CONSTRAINT chk_user_role
    CHECK (role IN ('juez', 'visitante', 'arbitro', 'admin', 'dev', 'registro'));

WITH user_seed(id, username, name, role, password_hash) AS (
    VALUES
        (1,  'admin',              'Administrador',                              'admin',     '$2b$10$SLNSdMb6Vtp/q/E5vw8gc.1AQrl13nELUA.mV2hAcqnzNeVzUq0u6'),
        (2,  'dev',                'Desarrollador',                              'dev',       '$2b$10$fGnmXZSZ5yfbgdXQEzsg2.xL7XwSDQqISDqpP88p7ns9c9qZ0d7O6'),
        (3,  'visitante',          'Visitante',                                  'visitante', '$2b$10$DBILz6gKc/wSjkffkw/2AuBo.bpwl7fDUa1uIdXYCwqdcJrTtsjiW'),
        (4,  'guillermo.iglesias', 'Ing. Guillermo Elías Iglesias López',        'juez',      '$2b$10$uuQMcINfGGPQ09/jJuV42.LAIVuPrX0PRab/IGUTjFAuV5urODyW2'),
        (5,  'jesus.hernandez',    'Ing. Jesús Arturo Hernández Soberón',        'juez',      '$2b$10$SeqYsoX4nz4/FzTWRDxWpON759dEurKaW2trhufqtPxdY6LAZKI1e'),
        (6,  'alejandra.gonzales', 'Mtra. Alejandra González Miranda',           'juez',      '$2b$10$rPkb6WNcVbBwOXrqT4x3aO327rK1ZkxHXJ/mcj8MP7nXh1KOjBLrW'),
        (7,  'martha.sanchez',     'Mtra. Martha Lilia Sánchez Sánchez',         'juez',      '$2b$10$wrorlrQpWN6tCVE2k.PmL.P/l15PbqUnytPi4KPjLI5ZmEttiXagK'),
        (8,  'raul.uranga',        'Ing. Raúl Uranga Cruz',                      'juez',      '$2b$10$xb5DhaXCIY8fK2xaDcHW1uQWVzQ5WUDTBbHWDsoLMFCSey2x/Hoy2'),
        (9,  'rogelio.galvan',     'Mtro. Rogelio Galván Hernández',             'juez',      '$2b$10$HJ6ModUrjNILeCOKvd51AOJs3BSWGqn.mmE4mDBOWtNBE1VVa7Joa'),
        (10, 'rosendo.deluna',     'Mtro. Rosendo de Luna Álvarez',              'arbitro',   '$2b$10$upaqqajpYBQypazCG9rBGe/.lGSdwTQSbqmS0rmow1eHE0Qsq64wC'),
        (11, 'estela.salas',       'Mtra. Estela Salas Siller',                  'arbitro',   '$2b$10$4/x43JpTWETT5KcbeqSbwuY3yiMMZTXbnANDwOoCsOLr8Hhcss/RW'),
        (12, 'juan.serrano',       'Ing. Juan Jaime Serrano Torres',             'arbitro',   '$2b$10$cyzY/BuId/501Owq9Vooj.kc5RZ0sapG8xvHQbn4m4dCV99XOEdOC'),
        (13, 'manuel.zertuche',    'Zertuche Ramírez Manuel Alonso 3B IEE',      'arbitro',   '$2b$10$sBEsISh3LmcOYKLqV8L71uYcJeZL0FZ/ZU9yFCEpELCcdIgkv.Brq'),
        (14, 'ximena.silva',       'Silva García Ximena 3C IEE',                 'arbitro',   '$2b$10$j6FqoiwdRPo6GEU2RNdSu.D29XzlgFJwG3zaYYeaOj04ZwLoi3cRG'),
        (15, 'felix.macias',       'Macías López Félix Emmanuel 3A IEE',         'arbitro',   '$2b$10$QbKNGZzzCdBPIIWMVlhI0OTQ35vn7WkutpLzrVSgqzXvo.JVjhXma'),
        (16, 'teamregistro',       'Registro de equipos',                        'registro',  '$2b$10$IbfhtowlfDGlTmp/cZxX/u.4MrE7lYi/AZJEOhOyqY2CBLnJo0IOa')
)
INSERT INTO user_account (id, username, name, role, password_hash)
SELECT id, username, name, role, password_hash
FROM user_seed
ON CONFLICT (username) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role;
-- No actualizar password_hash en conflicto: preserva contraseñas ya configuradas.

SELECT setval(
    pg_get_serial_sequence('user_account', 'id'),
    GREATEST((SELECT MAX(id) FROM user_account), 1)
);

WITH user_assignment(username, category_name, is_internal) AS (
    VALUES
        ('guillermo.iglesias', 'Minisumo',  false),
        ('jesus.hernandez',    'Velocista', false),
        ('alejandra.gonzales', 'Futbol',    false),
        ('martha.sanchez',     'Minisumo',  true),
        ('raul.uranga',        'Velocista', true),
        ('rogelio.galvan',     'Futbol',    true),
        ('rosendo.deluna',     'Minisumo',  false),
        ('estela.salas',       'Velocista', false),
        ('juan.serrano',       'Futbol',    false),
        ('manuel.zertuche',    'Minisumo',  true),
        ('ximena.silva',       'Velocista', true),
        ('felix.macias',       'Futbol',    true)
),
assigned_users AS (
    SELECT u.id
    FROM user_account u
    JOIN user_assignment ua ON ua.username = u.username
)
DELETE FROM user_category uc
USING assigned_users au
WHERE uc.user_id = au.id;

WITH user_assignment(username, category_name, is_internal) AS (
    VALUES
        ('guillermo.iglesias', 'Minisumo',  false),
        ('jesus.hernandez',    'Velocista', false),
        ('alejandra.gonzales', 'Futbol',    false),
        ('martha.sanchez',     'Minisumo',  true),
        ('raul.uranga',        'Velocista', true),
        ('rogelio.galvan',     'Futbol',    true),
        ('rosendo.deluna',     'Minisumo',  false),
        ('estela.salas',       'Velocista', false),
        ('juan.serrano',       'Futbol',    false),
        ('manuel.zertuche',    'Minisumo',  true),
        ('ximena.silva',       'Velocista', true),
        ('felix.macias',       'Futbol',    true)
)
INSERT INTO user_category (user_id, category_id, is_internal)
SELECT u.id, c.id, ua.is_internal
FROM user_assignment ua
JOIN user_account u ON u.username = ua.username
JOIN category c ON c.name = ua.category_name
ON CONFLICT (user_id, category_id) DO UPDATE
SET is_internal = EXCLUDED.is_internal;

SELECT u.id, u.username, u.name, u.role,
       c.name AS categoria, uc.is_internal AS interno,
       left(u.password_hash, 27) || '…' AS hash_prefix
FROM user_account u
LEFT JOIN user_category uc ON uc.user_id = u.id
LEFT JOIN category c ON c.id = uc.category_id
ORDER BY u.id;
