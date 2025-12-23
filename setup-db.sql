-- Quick Database Setup Script
-- Run this as MySQL root user to create database and user

-- Create database
CREATE DATABASE IF NOT EXISTS sas;

-- Create user with password
CREATE USER IF NOT EXISTS 'sas_app'@'localhost' IDENTIFIED BY 'sas_strong_password_123';

-- Grant all privileges on sas database
GRANT ALL PRIVILEGES ON sas.* TO 'sas_app'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Show created user
SELECT User, Host FROM mysql.user WHERE User = 'sas_app';

-- Show message
SELECT 'Database and user created successfully!' AS Status;
