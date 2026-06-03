-- Seed de competencia: Velocista, Minisumo, Futbol — equipos con robots ya validados.

WITH category_seed(name) AS (
    VALUES
        ('Velocista'),
        ('Minisumo'),
        ('Futbol')
)
INSERT INTO category (name)
SELECT name
FROM category_seed
ON CONFLICT (name) DO NOTHING;

WITH rule_seed(category_name, description, type) AS (
    VALUES
        ('Minisumo', 'Robot must fit inside 10cm x 10cm', 'characteristic'),
        ('Minisumo', 'Robot must weigh 500g or less', 'characteristic'),
        ('Minisumo', 'Robot must not use a jammer', 'restriction'),
        ('Minisumo', 'Robot must not damage the opponent', 'restriction'),
        ('Velocista', 'Robot must start behind the line', 'characteristic'),
        ('Velocista', 'Robot must follow the track autonomously', 'characteristic'),
        ('Velocista', 'Robot must not leave parts on the track', 'restriction'),
        ('Futbol', 'Team must register 2 valid robots', 'characteristic'),
        ('Futbol', '2v2 match: two robots per team on field', 'characteristic'),
        ('Futbol', 'Robot must not damage the opponent', 'restriction')
)
INSERT INTO rule (description, type, category_id)
SELECT rs.description, rs.type, c.id
FROM rule_seed rs
JOIN category c ON c.name = rs.category_name
WHERE NOT EXISTS (
    SELECT 1
    FROM rule r
    WHERE r.description = rs.description
      AND r.category_id = c.id
);

WITH team_seed(name, school, grade, teacher, category_name) AS (
    VALUES
        -- Minisumo (8)
        ('Minisumo Alpha', 'Universidad Tecnológica del Norte de Coahuila', '10', 'Prof. Ana', 'Minisumo'),
        ('Minisumo Gamma', 'UTNC', '11', 'Prof. Ana', 'Minisumo'),
        ('Minisumo Delta', 'Universidad Tecnológica del Norte de Coahuila', '12', 'Prof. Luis', 'Minisumo'),
        ('Minisumo Omega', 'UTNC', '9', 'Prof. Luis', 'Minisumo'),
        ('Minisumo Beta', 'Escuela Secundaria Centro', '11', 'Prof. Carla', 'Minisumo'),
        ('Minisumo Centro', 'Preparatoria Central', '10', 'Prof. Pedro', 'Minisumo'),
        ('Minisumo Norte', 'CBTis 122', '12', 'Prof. Rosa', 'Minisumo'),
        ('Minisumo Sur', 'Instituto Tecnológico Sur', '11', 'Prof. Jorge', 'Minisumo'),
        -- Velocista (6)
        ('Velocista Flash', 'Universidad Tecnológica del Norte de Coahuila', '12', 'Prof. Mario', 'Velocista'),
        ('Velocista Rayo', 'UTNC', '11', 'Prof. Mario', 'Velocista'),
        ('Velocista Turbo', 'Universidad Tecnológica del Norte de Coahuila', '10', 'Prof. Elena', 'Velocista'),
        ('Velocista Cohete', 'UTNC', '9', 'Prof. Elena', 'Velocista'),
        ('Velocista Norte', 'CBTis 122', '8', 'Prof. Diego', 'Velocista'),
        ('Velocista Sprint', 'Preparatoria Central', '12', 'Prof. Sofia', 'Velocista'),
        -- Futbol (6 equipos × 2 robots)
        ('Futbol Rojos', 'Universidad Tecnológica del Norte de Coahuila', '12', 'Prof. Mario', 'Futbol'),
        ('Futbol Verde', 'UTNC', '11', 'Prof. Carla', 'Futbol'),
        ('Futbol Dorado', 'Universidad Tecnológica del Norte de Coahuila', '10', 'Prof. Luis', 'Futbol'),
        ('Futbol Azules', 'Escuela Secundaria Centro', '11', 'Prof. Carla', 'Futbol'),
        ('Futbol Titanes', 'CBTis 122', '12', 'Prof. Pedro', 'Futbol'),
        ('Futbol Leones', 'Instituto Tecnológico Sur', '11', 'Prof. Rosa', 'Futbol')
)
INSERT INTO team (name, school, grade, teacher, category_id)
SELECT ts.name, ts.school, ts.grade, ts.teacher, c.id
FROM team_seed ts
JOIN category c ON c.name = ts.category_name
ON CONFLICT (name) DO NOTHING;

WITH member_seed(team_name, name, email, is_leader) AS (
    VALUES
        ('Minisumo Alpha', 'Alex Alpha', 'alex.alpha@utnc.edu.mx', true),
        ('Minisumo Alpha', 'Ana Alpha', 'ana.alpha@utnc.edu.mx', false),
        ('Minisumo Gamma', 'Bruno Gamma', 'bruno.gamma@utnc.edu.mx', true),
        ('Minisumo Delta', 'Carla Delta', 'carla.delta@utnc.edu.mx', true),
        ('Minisumo Omega', 'Diego Omega', 'diego.omega@utnc.edu.mx', true),
        ('Minisumo Beta', 'Bruno Beta', 'bruno.beta@example.com', true),
        ('Minisumo Centro', 'Cesar Centro', 'cesar.centro@example.com', true),
        ('Minisumo Norte', 'Nora Norte', 'nora.norte@example.com', true),
        ('Minisumo Sur', 'Sam Sur', 'sam.sur@example.com', true),
        ('Velocista Flash', 'Flash Leader', 'flash@utnc.edu.mx', true),
        ('Velocista Rayo', 'Rayo Leader', 'rayo@utnc.edu.mx', true),
        ('Velocista Turbo', 'Turbo Leader', 'turbo@utnc.edu.mx', true),
        ('Velocista Cohete', 'Cohete Leader', 'cohete@utnc.edu.mx', true),
        ('Velocista Norte', 'Norte Leader', 'norte@example.com', true),
        ('Velocista Sprint', 'Sprint Leader', 'sprint@example.com', true),
        ('Futbol Rojos', 'Capitan Rojo', 'rojo@utnc.edu.mx', true),
        ('Futbol Rojos', 'Portero Rojo', 'portero.rojo@utnc.edu.mx', false),
        ('Futbol Verde', 'Capitan Verde', 'verde@utnc.edu.mx', true),
        ('Futbol Dorado', 'Capitan Dorado', 'dorado@utnc.edu.mx', true),
        ('Futbol Azules', 'Capitan Azul', 'azul@example.com', true),
        ('Futbol Titanes', 'Capitan Titan', 'titan@example.com', true),
        ('Futbol Leones', 'Capitan Leon', 'leon@example.com', true)
)
INSERT INTO member (name, email, is_leader, team_id)
SELECT ms.name, ms.email, ms.is_leader, t.id
FROM member_seed ms
JOIN team t ON t.name = ms.team_name
WHERE NOT EXISTS (
    SELECT 1 FROM member m WHERE m.email = ms.email AND m.team_id = t.id
);

-- Robots: 1 por equipo (Minisumo/Velocista), 2 por equipo (Futbol).
INSERT INTO robot (team_id, is_valid)
SELECT teams.team_id, false
FROM (
    SELECT t.id AS team_id, c.name AS cat_name
    FROM team t
    JOIN category c ON c.id = t.category_id
    WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
) teams
CROSS JOIN LATERAL generate_series(
    1,
    CASE WHEN teams.cat_name = 'Futbol' THEN 2 ELSE 1 END
) AS g(seq)
LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS cnt FROM robot r WHERE r.team_id = teams.team_id
) rc ON true
WHERE g.seq > rc.cnt;

-- Marcar todas las reglas de la categoría como cumplidas en cada robot.
INSERT INTO robot_valid_rule (robot_id, rule_id)
SELECT r.id, ru.id
FROM robot r
JOIN team t ON t.id = r.team_id
JOIN category c ON c.id = t.category_id
JOIN rule ru ON ru.category_id = c.id
WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
ON CONFLICT (robot_id, rule_id) DO NOTHING;

-- is_valid = true cuando el robot tiene todas las reglas de su categoría.
UPDATE robot r
SET is_valid = true
FROM team t
JOIN category c ON c.id = t.category_id
WHERE r.team_id = t.id
  AND c.name IN ('Velocista', 'Minisumo', 'Futbol')
  AND (
      SELECT COUNT(*) FROM robot_valid_rule rvr WHERE rvr.robot_id = r.id
  ) = (
      SELECT COUNT(*) FROM rule ru WHERE ru.category_id = t.category_id
  );

-- Cualquier robot restante en categorías del evento (p. ej. equipos viejos).
INSERT INTO robot (team_id, is_valid)
SELECT t.id, false
FROM team t
JOIN category c ON c.id = t.category_id
WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
  AND NOT EXISTS (SELECT 1 FROM robot r WHERE r.team_id = t.id);

INSERT INTO robot_valid_rule (robot_id, rule_id)
SELECT r.id, ru.id
FROM robot r
JOIN team t ON t.id = r.team_id
JOIN category c ON c.id = t.category_id
JOIN rule ru ON ru.category_id = c.id
WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
ON CONFLICT (robot_id, rule_id) DO NOTHING;

UPDATE robot r
SET is_valid = true
FROM team t
JOIN category c ON c.id = t.category_id
WHERE r.team_id = t.id
  AND c.name IN ('Velocista', 'Minisumo', 'Futbol')
  AND (
      SELECT COUNT(*) FROM robot_valid_rule rvr WHERE rvr.robot_id = r.id
  ) = (
      SELECT COUNT(*) FROM rule ru WHERE ru.category_id = t.category_id
  );
