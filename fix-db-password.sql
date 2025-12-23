-- Fix MySQL password to match .env file
-- Run this as root: mysql -u root -p < fix-db-password.sql

-- Drop existing user if exists
DROP USER IF EXISTS 'sas_app'@'localhost';

-- Create user with password from .env (9482824040)
CREATE USER 'sas_app'@'localhost' IDENTIFIED BY '9482824040';

-- Grant all privileges
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SELECT User, Host FROM mysql.user WHERE User = 'sas_app';
SELECT 'Password updated successfully!' AS Status;
