---------------------------------------------------------------
-- Example SQL Server Procedures to be deleted
---------------------------------------------------------------

-- Create user
CREATE OR ALTER PROCEDURE spCreateUser
  @Username NVARCHAR(100),
  @PasswordHash NVARCHAR(200)
AS
BEGIN
  INSERT INTO dbo.Users (Username, PasswordHash)
  VALUES (@Username, @PasswordHash);
END
GO

-- Get user by username
CREATE OR ALTER PROCEDURE spGetUserByUsername
  @Username NVARCHAR(100)
AS
BEGIN
  SELECT * FROM dbo.Users WHERE Username = @Username;
END
GO

-- Fetch items for a given user
CREATE OR ALTER PROCEDURE spGetItemsForUser
  @UserId INT
AS
BEGIN
  SELECT * FROM dbo.Items WHERE UserId = @UserId;
END
GO

/* -----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping One
-----------------------------------------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------
-- User Management Stored Procedures
----------------------------------------------------------------*/


-- Create or update a user (username, hashed password, roles)
CREATE OR ALTER PROCEDURE spCreateUser
  @Username     NVARCHAR(100),
  @PasswordHash NVARCHAR(200),
  @Roles        NVARCHAR(200) = 'patient'   -- e.g. 'patient' or 'Admin,Provider'
AS
BEGIN
  INSERT INTO dbo.Users (Username, PasswordHash, Roles)
  VALUES (@Username, @PasswordHash, @Roles);
END
GO

-- Get a user by username (includes security QA fields)
CREATE OR ALTER PROCEDURE spGetUserByUsername
  @Username NVARCHAR(100)
AS
BEGIN
  SELECT *
    FROM dbo.Users
   WHERE Username = @Username;
END
GO

-- Get a user by ID
CREATE OR ALTER PROCEDURE spGetUserById
  @Id INT
AS
BEGIN
  SELECT * FROM dbo.Users WHERE Id = @Id;
END
GO

-- Change a user's password
CREATE OR ALTER PROCEDURE spChangePassword
  @Id            INT,
  @PasswordHash  NVARCHAR(200)
AS
BEGIN
  UPDATE dbo.Users
    SET PasswordHash = @PasswordHash
    WHERE Id = @Id;
END
GO

-- Set or update a user's security question & hashed answer
CREATE OR ALTER PROCEDURE spSetSecurityQA
  @UserId              INT,
  @SecurityQuestion    NVARCHAR(255),
  @SecurityAnswerHash  NVARCHAR(200)
AS
BEGIN
  UPDATE dbo.Users
    SET SecurityQuestion   = @SecurityQuestion,
        SecurityAnswerHash = @SecurityAnswerHash
    WHERE Id = @UserId;
END
GO

-- Get security question & answer hash for a given username
CREATE OR ALTER PROCEDURE spGetSecurityQAByUsername
  @Username NVARCHAR(100)
AS
BEGIN
  SELECT Id,
         SecurityQuestion,
         SecurityAnswerHash
    FROM dbo.Users
   WHERE Username = @Username;
END
GO

-- Fetch items for a given user
CREATE OR ALTER PROCEDURE spGetItemsForUser
  @UserId INT
AS
BEGIN
  SELECT * FROM dbo.Items WHERE UserId = @UserId;
END
GO

-----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping Two - Noah Oriano - Procedures
-----------------------------------------------------------------------------------------------------------------------------------------------------------------
/* ============================================================
   Change delimiter for this script. So that it is not the semicolon. Will revert at the end
============================================================ */
DELIMITER $$

/* ============================================================
   1. PATIENT
============================================================ */
DROP PROCEDURE IF EXISTS sp_add_patient$$
CREATE PROCEDURE sp_add_patient (
    IN  p_first_name   VARCHAR(50),
    IN  p_last_name    VARCHAR(50),
    IN  p_dob          DATE
)
/*  Adds a new patient and returns the new Patient_ID.          */
BEGIN
    START TRANSACTION;
        INSERT INTO PATIENT (First_Name, Last_Name, Date_Of_Birth)
        VALUES              (p_first_name, p_last_name, p_dob);
        SELECT LAST_INSERT_ID() AS New_Patient_ID;
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_update_patient$$
CREATE PROCEDURE sp_update_patient (
    IN  p_patient_id   INT,
    IN  p_first_name   VARCHAR(50),
    IN  p_last_name    VARCHAR(50),
    IN  p_dob          DATE
)
/*  Updates core demographics; DOB may be NULL to keep prior.   */
BEGIN
    UPDATE PATIENT
       SET First_Name     = COALESCE(p_first_name, First_Name),
           Last_Name      = COALESCE(p_last_name , Last_Name ),
           Date_Of_Birth  = COALESCE(p_dob       , Date_Of_Birth)
     WHERE Patient_ID = p_patient_id;
END$$

/* ============================================================
   2. PHYSICIAN
============================================================ */
DROP PROCEDURE IF EXISTS sp_add_physician$$
CREATE PROCEDURE sp_add_physician (
    IN  p_first_name   VARCHAR(50),
    IN  p_last_name    VARCHAR(50),
    IN  p_role         VARCHAR(50)
)
/*  Inserts a physician record and returns the new ID.          */
BEGIN
    START TRANSACTION;
        INSERT INTO PHYSICIAN (First_Name, Last_Name, Role)
        VALUES                (p_first_name, p_last_name, p_role);
        SELECT LAST_INSERT_ID() AS New_Physician_ID;
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_update_physician$$
CREATE PROCEDURE sp_update_physician (
    IN  p_physician_id INT,
    IN  p_first_name   VARCHAR(50),
    IN  p_last_name    VARCHAR(50),
    IN  p_role         VARCHAR(50)
)
BEGIN
    UPDATE PHYSICIAN
       SET First_Name = COALESCE(p_first_name, First_Name),
           Last_Name  = COALESCE(p_last_name , Last_Name ),
           Role       = COALESCE(p_role      , Role)
     WHERE Physician_ID = p_physician_id;
END$$

/* ============================================================
   3. MEDICATION  (catalog)
============================================================ */
DROP PROCEDURE IF EXISTS sp_add_medication$$
CREATE PROCEDURE sp_add_medication (
    IN  p_name     VARCHAR(100),
    IN  p_form     VARCHAR(30),
    IN  p_strength VARCHAR(30)
)
BEGIN
    INSERT INTO MEDICATION (Medication_Name, Form, Strength)
    VALUES                  (p_name         , p_form, p_strength);
END$$

/* ============================================================
   4. PRESCRIPTION -- header + lines in one call
============================================================ */
DROP PROCEDURE IF EXISTS sp_create_prescription$$
CREATE PROCEDURE sp_create_prescription (
    IN  p_physician_id  INT,
    IN  p_patient_id    INT,
    IN  p_issue_date    DATE,
    IN  p_notes         TEXT
)
/*  Creates an empty prescription header.  
    Call sp_add_prescription_med for each drug afterwards.      */
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN  ROLLBACK;  SIGNAL SQLSTATE '45000'
               SET MESSAGE_TEXT = 'Prescription insert failed';  END;

    START TRANSACTION;
        INSERT INTO PRESCRIPTION
              (Prescribing_Physician_ID, Patient_ID, Issued_Date, Notes)
        VALUES(p_physician_id,            p_patient_id, p_issue_date, p_notes);
        SELECT LAST_INSERT_ID() AS New_Prescription_ID;
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_add_prescription_med$$
CREATE PROCEDURE sp_add_prescription_med (
    IN  p_prescription_id INT,
    IN  p_medication_id   INT,
    IN  p_dosage          VARCHAR(50),
    IN  p_frequency       VARCHAR(50),
    IN  p_refills         INT
)
/*  Adds a medication line to an existing prescription.         */
BEGIN
    INSERT INTO PRESCRIPTION_MEDICATION
          (Prescription_ID, Medication_ID, Dosage, Frequency, Refills)
    VALUES(p_prescription_id, p_medication_id, p_dosage, p_frequency,
           COALESCE(p_refills,0));
END$$

/* ============================================================
   5. SOAP ENTRY
============================================================ */
DROP PROCEDURE IF EXISTS sp_add_soap_entry$$
CREATE PROCEDURE sp_add_soap_entry (
    IN  p_patient_id   INT,
    IN  p_physician_id INT,
    IN  p_note_dt      DATETIME,
    IN  p_subj         TEXT,
    IN  p_obj          TEXT,
    IN  p_assessment   TEXT,
    IN  p_plan         TEXT
)
BEGIN
    INSERT INTO SOAP_ENTRIES
          (Patient_ID, Physician_ID, Note_DateTime,
           Subjective, Objective, Assessment, Plan)
    VALUES(p_patient_id, p_physician_id, p_note_dt,
           p_subj, p_obj, p_assessment, p_plan);
END$$

/* ============================================================
   6. ORDER (e.g., lab, imaging)
============================================================ */
DROP PROCEDURE IF EXISTS sp_place_order$$
CREATE PROCEDURE sp_place_order (
    IN  p_physician_id    INT,
    IN  p_patient_id      INT,
    IN  p_prescription_id INT,
    IN  p_order_type      VARCHAR(50),
    IN  p_description     TEXT
)
BEGIN
    INSERT INTO ORDERS
          (Ordering_Physician_ID, Patient_ID, Prescription_ID,
           Order_Type, Order_Description, Order_Date)
    VALUES(p_physician_id, p_patient_id, p_prescription_id,
           p_order_type, p_description, CURDATE());
END$$

DROP PROCEDURE IF EXISTS sp_update_order_status$$
CREATE PROCEDURE sp_update_order_status (
    IN  p_order_id     INT,
    IN  p_new_status   VARCHAR(50)
)
BEGIN
    UPDATE ORDERS
       SET Order_Status    = p_new_status,
           Completion_Date = IF(p_new_status = 'Completed', CURDATE(),
                                Completion_Date)
     WHERE Order_ID = p_order_id;
END$$

/* ============================================================
   7. BILLING, PAYMENT, INSURANCE, CLAIM
============================================================ */
DROP PROCEDURE IF EXISTS sp_generate_bill$$
CREATE PROCEDURE sp_generate_bill (
    IN  p_patient_id             INT,
    IN  p_total_charges          DECIMAL(10,2),
    IN  p_patient_resp           DECIMAL(10,2),
    IN  p_bill_date              DATE
)
BEGIN
    START TRANSACTION;
        INSERT INTO BILLING
              (Patient_ID, Total_Charges, Patient_Responsibility, Bill_Date)
        VALUES(p_patient_id, p_total_charges, p_patient_resp, p_bill_date);
        SELECT LAST_INSERT_ID() AS New_Bill_ID;
    COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_record_payment$$
CREATE PROCEDURE sp_record_payment (
    IN  p_bill_id        INT,
    IN  p_pay_date       DATE,
    IN  p_amount         DECIMAL(10,2),
    IN  p_method         VARCHAR(50)
)
BEGIN
    INSERT INTO PAYMENT
          (Bill_ID, Payment_Date, Payment_Amount, Payment_Method)
    VALUES(p_bill_id, p_pay_date, p_amount, p_method);
END$$

DROP PROCEDURE IF EXISTS sp_file_insurance_claim$$
CREATE PROCEDURE sp_file_insurance_claim (
    IN  p_bill_id       INT,
    IN  p_insurance_id  INT,
    IN  p_claim_date    DATE,
    IN  p_amt_claimed   DECIMAL(10,2)
)
BEGIN
    INSERT INTO INSURANCE_CLAIM
          (Bill_ID, Insurance_ID, Claim_Date, Amount_Claimed)
    VALUES(p_bill_id, p_insurance_id, p_claim_date, p_amt_claimed);
END$$

DROP PROCEDURE IF EXISTS sp_update_claim_status$$
CREATE PROCEDURE sp_update_claim_status (
    IN  p_claim_id       INT,
    IN  p_status         VARCHAR(50),
    IN  p_amt_approved   DECIMAL(10,2),
    IN  p_paid_to_prov   DECIMAL(10,2)
)
BEGIN
    UPDATE INSURANCE_CLAIM
       SET Claim_Status     = p_status,
           Amount_Approved  = p_amt_approved,
           Paid_To_Provider = p_paid_to_prov
     WHERE Claim_ID = p_claim_id;
END$$

/* ============================================================
   8. REPORTING HELPERS
============================================================ */
DROP PROCEDURE IF EXISTS sp_patient_balance$$
CREATE PROCEDURE sp_patient_balance (
    IN  p_patient_id INT
)
/*  Returns current balance for a patient: charges – insurance – payments. */
BEGIN
    SELECT  b.Patient_ID,
            SUM(b.Total_Charges)                           AS Total_Charges,
            IFNULL(SUM(ic.Paid_To_Provider),0)             AS Insurance_Paid,
            IFNULL(SUM(p.Payment_Amount),0)                AS Patient_Paid,
            SUM(b.Total_Charges)
            - IFNULL(SUM(ic.Paid_To_Provider),0)
            - IFNULL(SUM(p.Payment_Amount),0)              AS Outstanding
    FROM   BILLING b
    LEFT   JOIN INSURANCE_CLAIM ic ON ic.Bill_ID = b.Bill_ID
    LEFT   JOIN PAYMENT p          ON p.Bill_ID   = b.Bill_ID
    WHERE  b.Patient_ID = p_patient_id
    GROUP  BY b.Patient_ID;
END$$

/* ============================================================
   Reset delimiter back to semicolon
============================================================ */
DELIMITER ;
-----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping Three
-----------------------------------------------------------------------------------------------------------------------------------------------------------------


