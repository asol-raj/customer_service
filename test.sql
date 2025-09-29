-- Active: 1758704013034@@127.0.0.1@3306@customer_service

SELECT * FROM users;

SELECT * FROM messages;

SELECT * FROM tickets;


SELECT 
    m.`id`, 
    u.`username`, 
    DATE_FORMAT(m.`created_at`, '%m-%d-%Y, %r') as `created_at`, 
    m.`message_text`, u.user_type
FROM `messages` m 
    JOIN `tickets` t on t.`id` = m.`ticket_id` 
    JOIN `users` u on u.`id` = m.`user_id` 
WHERE t.`id` = 1
ORDER BY m.id;


SELECT
    t.`subject`,
    m.`id` AS `message_id`,
    -- Use the user's full name, but fall back to the username if details are missing
    COALESCE(CONCAT(ud.`first_name`, ' ', ud.`last_name`), u.`username`) AS `sender_name`,
    u.`user_type`,
    m.`message_text`,
    DATE_FORMAT(m.`created_at`, '%h:%i %p, %b %d, %Y') AS `message_time`
FROM
    `messages` m
JOIN
    `users` u ON m.user_id = u.id
JOIN
    `tickets` t ON m.`ticket_id` = t.id
LEFT JOIN
    `user_details` ud ON u.`id` = ud.`user_id`
WHERE
    t.`id` = 1  -- 👈 Change this to the ticket ID you want to view
ORDER BY
    m.`created_at`; -- Order by creation time for a chronological conversation






































-- This method tells the database to ignore the rules temporarily
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE attachments;
TRUNCATE TABLE messages;
TRUNCATE TABLE user_details;
TRUNCATE TABLE tickets;
TRUNCATE TABLE users;

-- IMPORTANT: Always turn the checks back on
SET FOREIGN_KEY_CHECKS = 1;


SELECT * FROM users;
SELECT id, username, date_format(created_at, '%m-%d-%Y, %r') created_at FROM users WHERE user_type = 'customer' ORDER BY id DESC

SELECT * FROM tickets;
SELECT * FROM messages WHERE ticket_id = 3;

SELECT * FROM messages;

SELECT * FROM attachments WHERE ticket_id = 3

SELECT * FROM attachments;

SELECT 
    a.id AS attachment_id,
    a.file_name,
    a.file_path,
    a.file_type,
    a.uploaded_at,
    m.id AS message_id,
    m.message_text,
    m.created_at AS message_created_at,
    u.username AS uploaded_by
FROM attachments a
JOIN messages m ON a.message_id = m.id
JOIN users u ON m.user_id = u.id
WHERE m.ticket_id = 3
ORDER BY a.uploaded_at ASC;

SELECT a.*, m.ticket_id, t.user_id AS ticket_owner
FROM attachments a
JOIN messages m ON a.message_id = m.id
JOIN tickets t ON m.ticket_id = t.id
WHERE m.ticket_id = 3

show TABLEs;

-- TRUNCATE TABLE tickets;

TRUNCATE TABLE `attachments`;
TRUNCATE TABLE `messages`;
TRUNCATE TABLE `user_details`;
TRUNCATE TABLE `tickets`;
TRUNCATE TABLE `users`;

SELECT
    TABLE_NAME,
    CONSTRAINT_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    REFERENCED_TABLE_NAME = 'messages' AND TABLE_SCHEMA = 'customer_service';