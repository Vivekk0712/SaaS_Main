-- Fix 'sas_app' accounts for Windows MySQL so apps can authenticate
-- Run from Windows CMD as root:  mysql -u root -p < scripts\mysql-fix-sas-user.sql

CREATE DATABASE IF NOT EXISTS sas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure the user exists for all common host variants
CREATE USER IF NOT EXISTS 'sas_app'@'localhost' IDENTIFIED BY '9482824040';
CREATE USER IF NOT EXISTS 'sas_app'@'127.0.0.1' IDENTIFIED BY '9482824040';
CREATE USER IF NOT EXISTS 'sas_app'@'%' IDENTIFIED BY '9482824040';

-- Set password (idempotent)
ALTER USER 'sas_app'@'localhost' IDENTIFIED BY '9482824040';
ALTER USER 'sas_app'@'127.0.0.1' IDENTIFIED BY '9482824040';
ALTER USER 'sas_app'@'%' IDENTIFIED BY '9482824040';

-- If needed, uncomment to switch to mysql_native_password plugin
-- ALTER USER 'sas_app'@'localhost' IDENTIFIED WITH mysql_native_password BY '9482824040';
-- ALTER USER 'sas_app'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '9482824040';
-- ALTER USER 'sas_app'@'%' IDENTIFIED WITH mysql_native_password BY '9482824040';

GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'127.0.0.1';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'%';
FLUSH PRIVILEGES;
