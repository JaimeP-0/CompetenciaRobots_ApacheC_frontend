-- Restaura contraseñas del evento (credenciales-evento.private.md) y asignaciones de categoría reales.

UPDATE user_account AS u
SET password_hash = s.password_hash
FROM (
    VALUES
        ('admin', '$2b$10$SLNSdMb6Vtp/q/E5vw8gc.1AQrl13nELUA.mV2hAcqnzNeVzUq0u6'),
        ('dev', '$2b$10$fGnmXZSZ5yfbgdXQEzsg2.xL7XwSDQqISDqpP88p7ns9c9qZ0d7O6'),
        ('visitante', '$2b$10$DBILz6gKc/wSjkffkw/2AuBo.bpwl7fDUa1uIdXYCwqdcJrTtsjiW'),
        ('guillermo.iglesias', '$2b$10$uuQMcINfGGPQ09/jJuV42.LAIVuPrX0PRab/IGUTjFAuV5urODyW2'),
        ('jesus.hernandez', '$2b$10$SeqYsoX4nz4/FzTWRDxWpON759dEurKaW2trhufqtPxdY6LAZKI1e'),
        ('alejandra.gonzales', '$2b$10$rPkb6WNcVbBwOXrqT4x3aO327rK1ZkxHXJ/mcj8MP7nXh1KOjBLrW'),
        ('martha.sanchez', '$2b$10$wrorlrQpWN6tCVE2k.PmL.P/l15PbqUnytPi4KPjLI5ZmEttiXagK'),
        ('raul.uranga', '$2b$10$xb5DhaXCIY8fK2xaDcHW1uQWVzQ5WUDTBbHWDsoLMFCSey2x/Hoy2'),
        ('rogelio.galvan', '$2b$10$HJ6ModUrjNILeCOKvd51AOJs3BSWGqn.mmE4mDBOWtNBE1VVa7Joa'),
        ('rosendo.deluna', '$2b$10$upaqqajpYBQypazCG9rBGe/.lGSdwTQSbqmS0rmow1eHE0Qsq64wC'),
        ('estela.salas', '$2b$10$4/x43JpTWETT5KcbeqSbwuY3yiMMZTXbnANDwOoCsOLr8Hhcss/RW'),
        ('juan.serrano', '$2b$10$cyzY/BuId/501Owq9Vooj.kc5RZ0sapG8xvHQbn4m4dCV99XOEdOC'),
        ('manuel.zertuche', '$2b$10$sBEsISh3LmcOYKLqV8L71uYcJeZL0FZ/ZU9yFCEpELCcdIgkv.Brq'),
        ('ximena.silva', '$2b$10$j6FqoiwdRPo6GEU2RNdSu.D29XzlgFJwG3zaYYeaOj04ZwLoi3cRG'),
        ('felix.macias', '$2b$10$QbKNGZzzCdBPIIWMVlhI0OTQ35vn7WkutpLzrVSgqzXvo.JVjhXma'),
        ('teamregistro', '$2b$10$IbfhtowlfDGlTmp/cZxX/u.4MrE7lYi/AZJEOhOyqY2CBLnJo0IOa')
) AS s(username, password_hash)
WHERE u.username = s.username;

-- Reasignar categorías staff (nombres reales tras import Excel)
WITH user_assignment(username, category_name, is_internal) AS (
    VALUES
        ('guillermo.iglesias', 'Minisumo', false),
        ('jesus.hernandez', 'Seguidor de línea velocista', false),
        ('alejandra.gonzales', 'Fútbol', false),
        ('martha.sanchez', 'Minisumo', true),
        ('raul.uranga', 'Seguidor de línea velocista', true),
        ('rogelio.galvan', 'Fútbol', true),
        ('rosendo.deluna', 'Minisumo', false),
        ('estela.salas', 'Seguidor de línea velocista', false),
        ('juan.serrano', 'Fútbol', false),
        ('manuel.zertuche', 'Minisumo', true),
        ('ximena.silva', 'Seguidor de línea velocista', true),
        ('felix.macias', 'Fútbol', true)
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
        ('guillermo.iglesias', 'Minisumo', false),
        ('jesus.hernandez', 'Seguidor de línea velocista', false),
        ('alejandra.gonzales', 'Fútbol', false),
        ('martha.sanchez', 'Minisumo', true),
        ('raul.uranga', 'Seguidor de línea velocista', true),
        ('rogelio.galvan', 'Fútbol', true),
        ('rosendo.deluna', 'Minisumo', false),
        ('estela.salas', 'Seguidor de línea velocista', false),
        ('juan.serrano', 'Fútbol', false),
        ('manuel.zertuche', 'Minisumo', true),
        ('ximena.silva', 'Seguidor de línea velocista', true),
        ('felix.macias', 'Fútbol', true)
)
INSERT INTO user_category (user_id, category_id, is_internal)
SELECT u.id, c.id, ua.is_internal
FROM user_assignment ua
JOIN user_account u ON u.username = ua.username
JOIN category c ON c.name = ua.category_name
ON CONFLICT (user_id, category_id) DO UPDATE
SET is_internal = EXCLUDED.is_internal;

-- Nombres oficiales (no se tocan al re-aplicar solo contraseñas arriba)
UPDATE user_account SET name = 'Ing. Guillermo Elías Iglesias López' WHERE username = 'guillermo.iglesias';
UPDATE user_account SET name = 'Ing. Jesús Arturo Hernández Soberón' WHERE username = 'jesus.hernandez';
UPDATE user_account SET name = 'Mtra. Alejandra González Miranda' WHERE username = 'alejandra.gonzales';
UPDATE user_account SET name = 'Mtra. Martha Lilia Sánchez Sánchez' WHERE username = 'martha.sanchez';
UPDATE user_account SET name = 'Ing. Raúl Uranga Cruz' WHERE username = 'raul.uranga';
UPDATE user_account SET name = 'Mtro. Rogelio Galván Hernández' WHERE username = 'rogelio.galvan';
UPDATE user_account SET name = 'Mtro. Rosendo de Luna Álvarez' WHERE username = 'rosendo.deluna';
UPDATE user_account SET name = 'Mtra. Estela Salas Siller' WHERE username = 'estela.salas';
UPDATE user_account SET name = 'Ing. Juan Jaime Serrano Torres' WHERE username = 'juan.serrano';
UPDATE user_account SET name = 'Zertuche Ramírez Manuel Alonso 3B IEE' WHERE username = 'manuel.zertuche';
UPDATE user_account SET name = 'Silva García Ximena 3C IEE' WHERE username = 'ximena.silva';
UPDATE user_account SET name = 'Macías López Félix Emmanuel 3A IEE' WHERE username = 'felix.macias';
UPDATE user_account SET name = 'Registro de equipos' WHERE username = 'teamregistro';

SELECT username, name, role, left(password_hash, 20) AS hash_prefix
FROM user_account
ORDER BY role, username;
