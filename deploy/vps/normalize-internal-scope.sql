-- Normaliza scope interno/externo por escuela y alinea partidas existentes.

UPDATE team
SET is_internal = CASE
    WHEN trim(coalesce(school, '')) IN (
        'UTNC',
        'UT',
        'Universidad Tecnológica del Norte de Coahuila'
    ) THEN true
    ELSE false
END;

WITH match_base AS (
    SELECT
        m.id AS match_id,
        COALESCE(
            m.team_a_id,
            m.team_b_id,
            (
                SELECT mq.team_id
                FROM match_queue mq
                WHERE mq.match_id = m.id
                ORDER BY mq.position
                LIMIT 1
            )
        ) AS ref_team_id
    FROM public."match" m
)
UPDATE public."match" m
SET is_internal = t.is_internal
FROM match_base mb
JOIN team t ON t.id = mb.ref_team_id
WHERE m.id = mb.match_id;

SELECT c.name AS category, t.is_internal AS team_scope, COUNT(*) AS teams
FROM team t
JOIN category c ON c.id = t.category_id
WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
GROUP BY c.name, t.is_internal
ORDER BY c.name, t.is_internal;

SELECT c.name AS category, m.is_internal AS match_scope, COUNT(*) AS matches
FROM public."match" m
JOIN category c ON c.id = m.category_id
WHERE c.name IN ('Velocista', 'Minisumo', 'Futbol')
GROUP BY c.name, m.is_internal
ORDER BY c.name, m.is_internal;
