-- DANGER: Irreversibly deletes the SAS database and app users.
-- Run from Windows CMD as root:
--   mysql -u root -p < scripts\mysql-nuke.sql

DROP DATABASE IF EXISTS sas;

DROP USER IF EXISTS 'sas_app'@'localhost';
DROP USER IF EXISTS 'sas_app'@'127.0.0.1';
DROP USER IF EXISTS 'sas_app'@'%';

FLUSH PRIVILEGES;

