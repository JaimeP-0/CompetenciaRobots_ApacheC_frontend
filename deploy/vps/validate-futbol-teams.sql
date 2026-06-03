-- Valida todos los equipos de categoría Futbol (2 robots por equipo, reglas + is_valid).

INSERT INTO robot (team_id, is_valid)
SELECT t.id, false
FROM team t
JOIN category c ON c.id = t.category_id
CROSS JOIN LATERAL generate_series(1, 2) AS g(seq)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS cnt FROM robot r WHERE r.team_id = t.id
) rc ON true
WHERE c.name = 'Futbol'
  AND g.seq > rc.cnt;

INSERT INTO robot_valid_rule (robot_id, rule_id)
SELECT r.id, ru.id
FROM robot r
JOIN team t ON t.id = r.team_id
JOIN category c ON c.id = t.category_id
JOIN rule ru ON ru.category_id = c.id
WHERE c.name = 'Futbol'
ON CONFLICT (robot_id, rule_id) DO NOTHING;

UPDATE robot r
SET is_valid = true
FROM team t
JOIN category c ON c.id = t.category_id
WHERE r.team_id = t.id
  AND c.name = 'Futbol'
  AND (
      SELECT COUNT(*) FROM robot_valid_rule rvr WHERE rvr.robot_id = r.id
  ) = (
      SELECT COUNT(*) FROM rule ru WHERE ru.category_id = t.category_id
  );

SELECT t.id, t.name,
       COUNT(r.id) AS robots_total,
       COUNT(*) FILTER (WHERE r.is_valid = true) AS robots_validos,
       MIN((SELECT COUNT(*) FROM robot_valid_rule rvr WHERE rvr.robot_id = r.id)) AS reglas_min_robot,
       MAX((SELECT COUNT(*) FROM robot_valid_rule rvr WHERE rvr.robot_id = r.id)) AS reglas_max_robot,
       (SELECT COUNT(*) FROM rule ru WHERE ru.category_id = t.category_id) AS reglas_categoria
FROM team t
JOIN category c ON c.id = t.category_id
LEFT JOIN robot r ON r.team_id = t.id
WHERE c.name = 'Futbol'
GROUP BY t.id, t.name, t.category_id
ORDER BY t.id;
