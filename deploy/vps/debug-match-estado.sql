SELECT m.id,
       c.name AS categoria,
       m.team_a_id,
       m.team_b_id,
       m.status,
       m.is_internal,
       CASE WHEN r.id IS NULL THEN 'sin_resultado' ELSE 'con_resultado' END AS resultado
FROM "match" m
JOIN category c ON c.id = m.category_id
LEFT JOIN result r ON r.match_id = m.id
ORDER BY m.id DESC
LIMIT 30;

SELECT c.name AS categoria,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE r.id IS NULL) AS pendientes,
       COUNT(*) FILTER (WHERE r.id IS NOT NULL) AS completadas
FROM "match" m
JOIN category c ON c.id = m.category_id
LEFT JOIN result r ON r.match_id = m.id
GROUP BY c.name
ORDER BY c.name;
