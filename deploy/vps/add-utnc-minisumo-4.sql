-- Agrega 4 equipos UTNC en Minisumo con líder y robot válido.

WITH cat AS (
    SELECT id
    FROM category
    WHERE lower(name) = 'minisumo'
    LIMIT 1
),
team_seed(name, school, grade, teacher) AS (
    VALUES
        ('Minisumo UTNC Halcones', 'Universidad Tecnológica del Norte de Coahuila', 'UTNC Nivel TSU', 'Mtro. Carlos Morales'),
        ('Minisumo UTNC Titanes', 'Universidad Tecnológica del Norte de Coahuila', 'UTNC Nivel TSU', 'Mtra. Erika Salinas'),
        ('Minisumo UTNC Vector', 'Universidad Tecnológica del Norte de Coahuila', 'UTNC Nivel Ingeniería', 'Ing. David Martínez'),
        ('Minisumo UTNC Quantum', 'Universidad Tecnológica del Norte de Coahuila', 'UTNC Nivel Ingeniería', 'Ing. Laura Gómez')
)
INSERT INTO team (name, school, grade, teacher, category_id, is_internal)
SELECT ts.name, ts.school, ts.grade, ts.teacher, cat.id, true
FROM team_seed ts
CROSS JOIN cat
ON CONFLICT (name) DO NOTHING;

WITH member_seed(team_name, name, email) AS (
    VALUES
        ('Minisumo UTNC Halcones', 'Líder Halcones', 'halcones.utnc@utnc.edu.mx'),
        ('Minisumo UTNC Titanes', 'Líder Titanes', 'titanes.utnc@utnc.edu.mx'),
        ('Minisumo UTNC Vector', 'Líder Vector', 'vector.utnc@utnc.edu.mx'),
        ('Minisumo UTNC Quantum', 'Líder Quantum', 'quantum.utnc@utnc.edu.mx')
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
    'Minisumo UTNC Halcones',
    'Minisumo UTNC Titanes',
    'Minisumo UTNC Vector',
    'Minisumo UTNC Quantum'
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
    'Minisumo UTNC Halcones',
    'Minisumo UTNC Titanes',
    'Minisumo UTNC Vector',
    'Minisumo UTNC Quantum'
)
ON CONFLICT (robot_id, rule_id) DO NOTHING;

UPDATE robot r
SET is_valid = true
FROM team t
WHERE r.team_id = t.id
  AND t.name IN (
      'Minisumo UTNC Halcones',
      'Minisumo UTNC Titanes',
      'Minisumo UTNC Vector',
      'Minisumo UTNC Quantum'
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
