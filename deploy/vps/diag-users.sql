SELECT username, name, role, left(password_hash, 29) AS hash_start
FROM user_account
ORDER BY username;

SELECT conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid = 'user_account'::regclass AND conname = 'chk_user_role';

SELECT u.username, c.name, uc.is_internal
FROM user_category uc
JOIN user_account u ON u.id = uc.user_id
JOIN category c ON c.id = uc.category_id
ORDER BY u.username;
