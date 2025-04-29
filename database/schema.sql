-- /mnt/data/DBS_Project-main/DBS_Project-main/database/schema.sql
DROP DATABASE IF EXISTS HMSS_AuthDB;
CREATE DATABASE HMSS_AuthDB;
USE HMSS_AuthDB;

-- Roles table
CREATE TABLE Role (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

-- Users table
CREATE TABLE User (
    user_id           INT AUTO_INCREMENT PRIMARY KEY,
    username          VARCHAR(50) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    security_question VARCHAR(255),
    security_answer   VARCHAR(255),
    active            TINYINT(1) NOT NULL DEFAULT 1,
    role_id           INT NOT NULL,
    CONSTRAINT fk_user_role
      FOREIGN KEY (role_id) REFERENCES Role(role_id)
);