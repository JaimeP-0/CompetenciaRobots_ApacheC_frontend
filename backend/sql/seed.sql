-- Datos de ejemplo (alineados al mock de la app)
INSERT INTO categories (id, name) VALUES
(1, 'Minisumo'),
(2, 'Seguidor de línea'),
(3, 'Sumobot');

INSERT INTO rules (id, category_id, description, sort_order) VALUES
(1, 1, 'Robots dentro del peso y volumen permitidos por reglamento.', 1),
(2, 1, 'Dohyo oficial; victoria por salida o inmovilización del rival.', 2),
(3, 2, 'Recorrido del circuito en el tiempo límite; sin atajos.', 1),
(4, 2, 'Sensores permitidos según convocatoria UTNC.', 2),
(5, 3, 'Empuje máximo regulado; prohibido dañar dohyo.', 1);

INSERT INTO teams (id, name, school, grade, teacher, category_id) VALUES
(1, 'Mini Titan', 'UTNC', '6°', 'Prof. Martínez', 1),
(2, 'Chispa 500', 'CBTis 12', '5°', 'Prof. Ruiz', 1),
(3, 'Equipo UTNC', 'UTNC', '4°', 'Prof. López', 2),
(4, 'Rayo MK', 'Conalep Norte', '6°', 'Prof. Hernández', 2),
(5, 'Empuje Total', 'Escuela Sec. 8', '3°', 'Prof. Vega', 3);

INSERT INTO team_members (team_id, name, email, is_leader) VALUES
(1, 'Ana López', 'ana@utnc.edu.mx', 1),
(1, 'Luis Gómez', NULL, 0),
(2, 'María Sánchez', 'maria@school.mx', 1),
(3, 'Pedro Díaz', NULL, 1),
(4, 'Laura Ruiz', 'laura@conalep.mx', 1),
(5, 'Jorge Vega', NULL, 1);

INSERT INTO validations (team_id, pass, payload_json) VALUES
(1, 1, '{"team_id":1,"pass":true}'),
(3, 1, '{"team_id":3,"pass":true}');

-- Usuario admin: crear hash en el servidor con password_hash('tu_clave', PASSWORD_DEFAULT)
-- Mientras tanto, config.php → demo_login acepta admin / admin
-- INSERT INTO admin_users (username, password_hash) VALUES ('admin', '...hash...');
