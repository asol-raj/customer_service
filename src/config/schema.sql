-- Active: 1758704013034@@127.0.0.1@3306@customer_service
-- CREATE DATABASE IF NOT EXISTS `customer_service`;
-- CREATE USER IF NOT EXISTS 'user_cs'@'%' IDENTIFIED BY '269608Raj$';
-- GRANT ALL PRIVILEGES ON `customer_service`.* TO 'user_cs'@'%' WITH GRANT OPTION;

-- USERS
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NULL UNIQUE,
    `password_hash` CHAR(60) NOT NULL,
    `user_type` ENUM('customer', 'staff') NOT NULL DEFAULT 'customer',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;


-- USER DETAILS
CREATE TABLE IF NOT EXISTS `user_details` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `middle_name` VARCHAR(50) NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `address` VARCHAR(200) NULL,
    `city` VARCHAR(100) NULL,
    `zipcode` VARCHAR(15) NULL,
    `state` VARCHAR(100) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_details_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- TICKETS
CREATE TABLE IF NOT EXISTS `tickets` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,  
    `assigned_to` INT UNSIGNED NULL,  
    `subject` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `invoice_number` VARCHAR(50) NULL,
    `policy_number` VARCHAR(50) NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tickets_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_tickets_staff`
        FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- MESSAGES (conversation inside a ticket)
CREATE TABLE IF NOT EXISTS `messages` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL, -- sender (customer or staff)
    `message_text` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_messages_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ATTACHMENTS (images, PDFs)
CREATE TABLE IF NOT EXISTS `attachments` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `message_id` INT UNSIGNED NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL, -- stored path or URL
    `file_type` ENUM('image', 'pdf', 'other') NOT NULL,
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_attachments_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;