-- Elimina categorías fantasma Velocista / Futbol (vacías tras import real).
-- Reasigna user_category de esas filas a las categorías reales si aún existen.

BEGIN;

-- Diagnóstico previo (visible en log)
SELECT id, name,
       (SELECT COUNT(*) FROM team t WHERE t.category_id = c.id) AS teams,
       (SELECT COUNT(*) FROM rule r WHERE r.category_id = c.id) AS rules,
       (SELECT COUNT(*) FROM "match" m WHERE m.category_id = c.id) AS matches,
       (SELECT COUNT(*) FROM user_category uc WHERE uc.category_id = c.id) AS user_cats
FROM category c
WHERE name IN ('Velocista', 'Futbol')
ORDER BY id;

-- Staff que aún apunte a Velocista → Seguidor de línea velocista
INSERT INTO user_category (user_id, category_id, is_internal)
SELECT uc.user_id, real_c.id, uc.is_internal
FROM user_category uc
JOIN category ghost ON ghost.id = uc.category_id AND ghost.name = 'Velocista'
JOIN category real_c ON real_c.name = 'Seguidor de línea velocista'
ON CONFLICT (user_id, category_id) DO UPDATE
SET is_internal = EXCLUDED.is_internal;

DELETE FROM user_category uc
USING category ghost
WHERE uc.category_id = ghost.id AND ghost.name = 'Velocista';

-- Staff que aún apunte a Futbol → Fútbol
INSERT INTO user_category (user_id, category_id, is_internal)
SELECT uc.user_id, real_c.id, uc.is_internal
FROM user_category uc
JOIN category ghost ON ghost.id = uc.category_id AND ghost.name = 'Futbol'
JOIN category real_c ON real_c.name = 'Fútbol'
ON CONFLICT (user_id, category_id) DO UPDATE
SET is_internal = EXCLUDED.is_internal;

DELETE FROM user_category uc
USING category ghost
WHERE uc.category_id = ghost.id AND ghost.name = 'Futbol';

-- Solo borrar si no tienen equipos, reglas ni partidas
DELETE FROM category c
WHERE c.name IN ('Velocista', 'Futbol')
  AND NOT EXISTS (SELECT 1 FROM team t WHERE t.category_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM rule r WHERE r.category_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM "match" m WHERE m.category_id = c.id);

-- Secuencia de IDs coherente con el máximo actual
SELECT setval(
    pg_get_serial_sequence('category', 'id'),
    COALESCE((SELECT MAX(id) FROM category), 1)
);

COMMIT;

SELECT id, name FROM category ORDER BY id;

SELECT c.name, COUNT(r.id) AS reglas
FROM category c
LEFT JOIN rule r ON r.category_id = c.id
GROUP BY c.name
ORDER BY c.name;
