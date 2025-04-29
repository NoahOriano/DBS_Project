-- 1. Create the database if you haven’t already:
CREATE DATABASE IF NOT EXISTS HMSS_AuthDB;

-- 2. Switch into it:
USE HMSS_AuthDB;

-- Grouping One

-- Switch delimiter so we can define procs with internal semicolons
DELIMITER //

-- 2. Add a new role
CREATE PROCEDURE sp_AddRole (
  IN p_role_name VARCHAR(50)
)
BEGIN
  INSERT INTO Role (role_name)
  VALUES (p_role_name);
END//

-- 3. Get all roles
CREATE PROCEDURE sp_GetAllRoles ()
BEGIN
  SELECT role_id, role_name FROM Role;
END//

-- 4. Add a new user
CREATE PROCEDURE sp_AddUser (
  IN p_username          VARCHAR(50),
  IN p_password          VARCHAR(50),
  IN p_security_question VARCHAR(255),
  IN p_security_answer   VARCHAR(255),
  IN p_role_id           INT
)
BEGIN
  INSERT INTO User (
    username, password_hash,
    security_question, security_answer,
    active, role_id
  ) VALUES (
    p_username,
    SHA2(p_password,256),
    p_security_question,
    SHA2(p_security_answer,256),
    1,
    p_role_id
  );
END//

-- 5. Get user by ID
CREATE PROCEDURE sp_GetUserByID (IN p_user_id INT)
BEGIN
  SELECT * FROM User WHERE user_id = p_user_id;
END//

-- 6. Deactivate a user
CREATE PROCEDURE sp_DeactivateUser (IN p_user_id INT)
BEGIN
  UPDATE User SET active = 0 WHERE user_id = p_user_id;
END//

-- 7. Update user password
CREATE PROCEDURE sp_UpdateUserPassword (
  IN p_user_id      INT,
  IN p_new_password VARCHAR(50)
)
BEGIN
  UPDATE User
    SET password_hash = SHA2(p_new_password,256)
    WHERE user_id = p_user_id;
END//

-- Restore normal SQL delimiter
DELIMITER ;


-- Grouping Two - Noah Oriano - Procedures


-- Grouping Three



