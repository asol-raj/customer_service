-- Active: 1758133010005@@localhost@3306@customer_service














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