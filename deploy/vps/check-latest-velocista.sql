SELECT m.id,
       m.is_internal,
       m.category_id,
       (SELECT mq.team_id FROM match_queue mq WHERE mq.match_id = m.id ORDER BY mq.position LIMIT 1) AS queue_team_id
FROM public."match" m
WHERE m.category_id = (SELECT id FROM category WHERE name = 'Velocista' LIMIT 1)
ORDER BY m.id DESC
LIMIT 6;
