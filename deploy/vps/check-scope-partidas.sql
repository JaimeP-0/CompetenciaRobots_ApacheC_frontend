SELECT c.name AS category,
       m.is_internal,
       COUNT(*) AS total
FROM public."match" m
JOIN category c ON c.id = m.category_id
WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
GROUP BY c.name, m.is_internal
ORDER BY c.name, m.is_internal;

SELECT c.name AS category,
       t.is_internal AS team_scope,
       COUNT(*) AS teams
FROM team t
JOIN category c ON c.id = t.category_id
WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
GROUP BY c.name, t.is_internal
ORDER BY c.name, t.is_internal;
