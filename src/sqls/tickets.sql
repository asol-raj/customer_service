SELECT
    `t`.`id`,
    DATE_FORMAT(`t`.`created_at`, '%m-%d-%Y, %r') AS `created_at`,
    `u`.`username` AS `customer_name`,
    `t`.`subject`,
    `t`.`description`,
    `t`.`invoice_number` AS `inv_num`,
    `t`.`policy_number`,
    `t`.`status`,
    `t`.`priority`,
    COALESCE(`f`.`followups`, 0)   AS `followups`,
    COALESCE(`a`.`attachments`, 0) AS `attachments`,
    CASE
        WHEN LOWER(`t`.`status`) NOT IN ('closed', 'resolved') 
            THEN DATEDIFF(CURDATE(), DATE(`t`.`created_at`))
        ELSE NULL
    END AS `days_past`
FROM `tickets` `t`
JOIN `users` `u`
  ON `u`.`id` = `t`.`user_id`
LEFT JOIN (
    SELECT `m`.`ticket_id`, COUNT(*) AS `followups`
    FROM `messages` `m`
    GROUP BY `m`.`ticket_id`
) `f`
  ON `f`.`ticket_id` = `t`.`id`
LEFT JOIN (
    SELECT `m`.`ticket_id`, COUNT(`a`.`id`) AS `attachments`
    FROM `messages` `m`
    JOIN `attachments` `a`
      ON `a`.`message_id` = `m`.`id`
    GROUP BY `m`.`ticket_id`
) `a`
  ON `a`.`ticket_id` = `t`.`id`
ORDER BY `t`.`id` DESC
LIMIT 50;
