-- Seed completo de usuarios staff + asignación categoría/cola.
-- Contraseñas en claro (solo evento): deploy/vps/credenciales-evento.private.md (no versionar).
-- Aplicar: npm run vps:users-seed  o  psql … < seed-users.sql

WITH user_seed(username, name, role, password_hash) AS (
    VALUES
        ('admin', 'Administrador', 'admin', '$2b$10$SLNSdMb6Vtp/q/E5vw8gc.1AQrl13nELUA.mV2hAcqnzNeVzUq0u6'),
        ('dev', 'Desarrollador', 'dev', '$2b$10$fGnmXZSZ5yfbgdXQEzsg2.xL7XwSDQqISDqpP88p7ns9c9qZ0d7O6'),
        ('visitante', 'Visitante', 'visitante', '$2b$10$DBILz6gKc/wSjkffkw/2AuBo.bpwl7fDUa1uIdXYCwqdcJrTtsjiW'),
        ('guillermo.iglesias', 'Ing. Guillermo Elías Iglesias López', 'juez', '$2b$10$uuQMcINfGGPQ09/jJuV42.LAIVuPrX0PRab/IGUTjFAuV5urODyW2'),
        ('jesus.hernandez', 'Ing. Jesús Arturo Hernández Soberón', 'juez', '$2b$10$SeqYsoX4nz4/FzTWRDxWpON759dEurKaW2trhufqtPxdY6LAZKI1e'),
        ('alejandra.gonzales', 'Mtra. Alejandra González Miranda', 'juez', '$2b$10$rPkb6WNcVbBwOXrqT4x3aO327rK1ZkxHXJ/mcj8MP7nXh1KOjBLrW'),
        ('martha.sanchez', 'Mtra. Martha Lilia Sánchez Sánchez', 'juez', '$2b$10$wrorlrQpWN6tCVE2k.PmL.P/l15PbqUnytPi4KPjLI5ZmEttiXagK'),
        ('raul.uranga', 'Ing. Raúl Uranga Cruz', 'juez', '$2b$10$xb5DhaXCIY8fK2xaDcHW1uQWVzQ5WUDTBbHWDsoLMFCSey2x/Hoy2'),
        ('rogelio.galvan', 'Mtro. Rogelio Galván Hernández', 'juez', '$2b$10$HJ6ModUrjNILeCOKvd51AOJs3BSWGqn.mmE4mDBOWtNBE1VVa7Joa'),
        ('rosendo.deluna', 'Mtro. Rosendo de Luna Álvarez', 'arbitro', '$2b$10$upaqqajpYBQypazCG9rBGe/.lGSdwTQSbqmS0rmow1eHE0Qsq64wC'),
        ('estela.salas', 'Mtra. Estela Salas Siller', 'arbitro', '$2b$10$4/x43JpTWETT5KcbeqSbwuY3yiMMZTXbnANDwOoCsOLr8Hhcss/RW'),
        ('juan.serrano', 'Ing. Juan Jaime Serrano Torres', 'arbitro', '$2b$10$cyzY/BuId/501Owq9Vooj.kc5RZ0sapG8xvHQbn4m4dCV99XOEdOC'),
        ('manuel.zertuche', 'Zertuche Ramírez Manuel Alonso 3B IEE', 'arbitro', '$2b$10$sBEsISh3LmcOYKLqV8L71uYcJeZL0FZ/ZU9yFCEpELCcdIgkv.Brq'),
        ('ximena.silva', 'Silva García Ximena 3C IEE', 'arbitro', '$2b$10$j6FqoiwdRPo6GEU2RNdSu.D29XzlgFJwG3zaYYeaOj04ZwLoi3cRG'),
        ('felix.macias', 'Macías López Félix Emmanuel 3A IEE', 'arbitro', '$2b$10$QbKNGZzzCdBPIIWMVlhI0OTQ35vn7WkutpLzrVSgqzXvo.JVjhXma'),
        ('teamregistro', 'Registro de equipos', 'registro', '$2b$10$IbfhtowlfDGlTmp/cZxX/u.4MrE7lYi/AZJEOhOyqY2CBLnJo0IOa')
)
INSERT INTO user_account (username, name, role, password_hash)
SELECT username, name, role, password_hash
FROM user_seed
ON CONFLICT (username) DO UPDATE
SET role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

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
