-- Valida todos los equipos de categoría Velocista (reglas + is_valid).

INSERT INTO robot (team_id, is_valid)
SELECT t.id, false
FROM team t
JOIN category c ON c.id = t.category_id
WHERE c.name = 'Velocista'
  AND NOT EXISTS (SELECT 1 FROM robot r WHERE r.team_id = t.id);

INSERT INTO robot_valid_rule (robot_id, rule_id)
SELECT r.id, ru.id
FROM robot r
JOIN team t ON t.id = r.team_id
JOIN category c ON c.id = t.category_id
JOIN rule ru ON ru.category_id = c.id
WHERE c.name = 'Velocista'
ON CONFLICT (robot_id, rule_id) DO NOTHING;

UPDATE robot r
SET is_valid = true
FROM team t
JOIN category c ON c.id = t.category_id
WHERE r.team_id = t.id
  AND c.name = 'Velocista'
  AND (
      SELECT COUNT(*) FROM robot_valid_rule rvr WHERE rvr.robot_id = r.id
  ) = (
      SELECT COUNT(*) FROM rule ru WHERE ru.category_id = t.category_id
  );

SELECT t.id, t.name, r.id AS robot_id, r.is_valid,
       (SELECT COUNT(*) FROM robot_valid_rule rvr WHERE rvr.robot_id = r.id) AS rules_ok,
       (SELECT COUNT(*) FROM rule ru WHERE ru.category_id = t.category_id) AS rules_total
FROM team t
JOIN category c ON c.id = t.category_id
LEFT JOIN robot r ON r.team_id = t.id
WHERE c.name = 'Velocista'
ORDER BY t.id;
