-- Quita validación a todos los robots (mesa de registro puede volver a validar).
BEGIN;
DELETE FROM robot_valid_rule;
UPDATE robot SET is_valid = false;
COMMIT;

SELECT COUNT(*) AS robots, COUNT(*) FILTER (WHERE is_valid) AS aun_validos FROM robot;
