-- DANGER: Drops and recreates the 'sas' database, and (re)configures the app user.
-- Run from Windows (CMD/PowerShell) as MySQL root:
--   PowerShell:
--     Get-Content .\scripts\mysql-reset.sql | mysql -u root -p
--   CMD:
--     mysql -u root -p < scripts\mysql-reset.sql

DROP DATABASE IF EXISTS sas;
CREATE DATABASE sas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure application users exist with the expected password on common hosts
CREATE USER IF NOT EXISTS 'sas_app'@'localhost' IDENTIFIED BY '9482824040';
CREATE USER IF NOT EXISTS 'sas_app'@'127.0.0.1' IDENTIFIED BY '9482824040';
CREATE USER IF NOT EXISTS 'sas_app'@'%' IDENTIFIED BY '9482824040';

-- Align passwords (idempotent)
ALTER USER 'sas_app'@'localhost' IDENTIFIED BY '9482824040';
ALTER USER 'sas_app'@'127.0.0.1' IDENTIFIED BY '9482824040';
ALTER USER 'sas_app'@'%' IDENTIFIED BY '9482824040';

-- If your server/plugin requires it, you can switch to mysql_native_password:
-- ALTER USER 'sas_app'@'localhost' IDENTIFIED WITH mysql_native_password BY '9482824040';
-- ALTER USER 'sas_app'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '9482824040';
-- ALTER USER 'sas_app'@'%' IDENTIFIED WITH mysql_native_password BY '9482824040';

GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'127.0.0.1';
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'%';
FLUSH PRIVILEGES;
