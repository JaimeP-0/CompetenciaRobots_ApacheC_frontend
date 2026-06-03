-- Agrega 4 equipos EXTERNOS en Minisumo con líder y robot válido.

WITH cat AS (
    SELECT id
    FROM category
    WHERE lower(name) = 'minisumo'
    LIMIT 1
),
team_seed(name, school, grade, teacher) AS (
    VALUES
        ('Minisumo Externo Dragones', 'CBTis 122', '5A', 'Mtro. Omar Peña'),
        ('Minisumo Externo Centuriones', 'Preparatoria Central', '6B', 'Mtra. Sofía Rojas'),
        ('Minisumo Externo Titan', 'CONALEP Monclova', '5C', 'Ing. Julián Prado'),
        ('Minisumo Externo Nova', 'Instituto Tecnológico Sur', '6A', 'Mtra. Karla Luna')
)
INSERT INTO team (name, school, grade, teacher, category_id, is_internal)
SELECT ts.name, ts.school, ts.grade, ts.teacher, cat.id, false
FROM team_seed ts
CROSS JOIN cat
ON CONFLICT (name) DO NOTHING;

WITH member_seed(team_name, name, email) AS (
    VALUES
        ('Minisumo Externo Dragones', 'Líder Dragones', 'dragones.minisumo@example.com'),
        ('Minisumo Externo Centuriones', 'Líder Centuriones', 'centuriones.minisumo@example.com'),
        ('Minisumo Externo Titan', 'Líder Titan', 'titan.minisumo@example.com'),
        ('Minisumo Externo Nova', 'Líder Nova', 'nova.minisumo@example.com')
)
INSERT INTO member (name, email, is_leader, team_id)
SELECT ms.name, ms.email, true, t.id
FROM member_seed ms
JOIN team t ON t.name = ms.team_name
WHERE NOT EXISTS (
    SELECT 1
    FROM member m
    WHERE m.email = ms.email
      AND m.team_id = t.id
);

INSERT INTO robot (team_id, is_valid)
SELECT t.id, false
FROM team t
WHERE t.name IN (
    'Minisumo Externo Dragones',
    'Minisumo Externo Centuriones',
    'Minisumo Externo Titan',
    'Minisumo Externo Nova'
)
AND NOT EXISTS (
    SELECT 1
    FROM robot r
    WHERE r.team_id = t.id
);

INSERT INTO robot_valid_rule (robot_id, rule_id)
SELECT r.id, ru.id
FROM robot r
JOIN team t ON t.id = r.team_id
JOIN category c ON c.id = t.category_id
JOIN rule ru ON ru.category_id = c.id
WHERE t.name IN (
    'Minisumo Externo Dragones',
    'Minisumo Externo Centuriones',
    'Minisumo Externo Titan',
    'Minisumo Externo Nova'
)
ON CONFLICT (robot_id, rule_id) DO NOTHING;

UPDATE robot r
SET is_valid = true
FROM team t
WHERE r.team_id = t.id
  AND t.name IN (
      'Minisumo Externo Dragones',
      'Minisumo Externo Centuriones',
      'Minisumo Externo Titan',
      'Minisumo Externo Nova'
  )
  AND (
      SELECT COUNT(*)
      FROM robot_valid_rule rvr
      WHERE rvr.robot_id = r.id
  ) = (
      SELECT COUNT(*)
      FROM rule ru
      WHERE ru.category_id = t.category_id
  );
