-- Switch to the target database
CREATE DATABASE IF NOT EXISTS HMSS_DB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE HMSS_DB;

-- ===================================================================
-- Grouping One: User Management Stored Procedures (MySQL syntax)
-- ===================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS spCreateUser$$
CREATE PROCEDURE spCreateUser (
  IN p_Username     VARCHAR(100),
  IN p_PasswordHash VARCHAR(200),
  IN p_Roles        VARCHAR(200)
)
BEGIN
  INSERT INTO Users (Username, PasswordHash, Roles)
    VALUES (p_Username, p_PasswordHash, p_Roles);
END$$

DROP PROCEDURE IF EXISTS spGetUserByUsername$$
CREATE PROCEDURE spGetUserByUsername (
  IN p_Username VARCHAR(100)
)
BEGIN
  SELECT * 
    FROM Users 
   WHERE Username = p_Username;
END$$

DROP PROCEDURE IF EXISTS spGetUserById$$
CREATE PROCEDURE spGetUserById (
  IN p_Id INT
)
BEGIN
  SELECT *
    FROM Users
   WHERE Id = p_Id;
END$$

DROP PROCEDURE IF EXISTS spChangePassword$$
CREATE PROCEDURE spChangePassword (
  IN p_Id           INT,
  IN p_PasswordHash VARCHAR(200)
)
BEGIN
  UPDATE Users
    SET PasswordHash = p_PasswordHash
   WHERE Id = p_Id;
END$$

DROP PROCEDURE IF EXISTS spSetSecurityQA$$
CREATE PROCEDURE spSetSecurityQA (
  IN p_UserId             INT,
  IN p_SecurityQuestion   VARCHAR(255),
  IN p_SecurityAnswerHash VARCHAR(200)
)
BEGIN
  UPDATE Users
    SET SecurityQuestion   = p_SecurityQuestion,
        SecurityAnswerHash = p_SecurityAnswerHash
   WHERE Id = p_UserId;
END$$

DROP PROCEDURE IF EXISTS spGetSecurityQAByUsername$$
CREATE PROCEDURE spGetSecurityQAByUsername (
  IN p_Username VARCHAR(100)
)
BEGIN
  SELECT Id,
         SecurityQuestion,
         SecurityAnswerHash
    FROM Users
   WHERE Username = p_Username;
END$$

DROP PROCEDURE IF EXISTS spGetItemsForUser$$
CREATE PROCEDURE spGetItemsForUser (
  IN p_UserId INT
)
BEGIN
  SELECT *
    FROM Items
   WHERE UserId = p_UserId;
END$$

DELIMITER ;


-- ===================================================================
-- Grouping Two: Clinical & Financial Procedures (MySQL/InnoDB)
-- ===================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_add_patient$$
CREATE PROCEDURE sp_add_patient (
  IN p_first_name VARCHAR(50),
  IN p_last_name  VARCHAR(50),
  IN p_dob        DATE
)
BEGIN
  START TRANSACTION;
    INSERT INTO PATIENT (First_Name, Last_Name, Date_Of_Birth)
      VALUES (p_first_name, p_last_name, p_dob);
    SELECT LAST_INSERT_ID() AS New_Patient_ID;
  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_update_patient$$
CREATE PROCEDURE sp_update_patient (
  IN p_patient_id INT,
  IN p_first_name VARCHAR(50),
  IN p_last_name  VARCHAR(50),
  IN p_dob        DATE
)
BEGIN
  UPDATE PATIENT
     SET First_Name    = COALESCE(p_first_name, First_Name),
         Last_Name     = COALESCE(p_last_name,  Last_Name),
         Date_Of_Birth = COALESCE(p_dob,        Date_Of_Birth)
   WHERE Patient_ID = p_patient_id;
END$$

DROP PROCEDURE IF EXISTS sp_add_physician$$
CREATE PROCEDURE sp_add_physician (
  IN p_first_name VARCHAR(50),
  IN p_last_name  VARCHAR(50),
  IN p_role       VARCHAR(50)
)
BEGIN
  START TRANSACTION;
    INSERT INTO PHYSICIAN (First_Name, Last_Name, Role)
      VALUES (p_first_name, p_last_name, p_role);
    SELECT LAST_INSERT_ID() AS New_Physician_ID;
  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_update_physician$$
CREATE PROCEDURE sp_update_physician (
  IN p_physician_id INT,
  IN p_first_name   VARCHAR(50),
  IN p_last_name    VARCHAR(50),
  IN p_role         VARCHAR(50)
)
BEGIN
  UPDATE PHYSICIAN
     SET First_Name = COALESCE(p_first_name, First_Name),
         Last_Name  = COALESCE(p_last_name,  Last_Name),
         Role       = COALESCE(p_role,       Role)
   WHERE Physician_ID = p_physician_id;
END$$

DROP PROCEDURE IF EXISTS sp_add_medication$$
CREATE PROCEDURE sp_add_medication (
  IN p_name     VARCHAR(100),
  IN p_form     VARCHAR(30),
  IN p_strength VARCHAR(30)
)
BEGIN
  INSERT INTO MEDICATION (Medication_Name, Form, Strength)
    VALUES (p_name, p_form, p_strength);
END$$

DROP PROCEDURE IF EXISTS sp_create_prescription$$
CREATE PROCEDURE sp_create_prescription (
  IN p_physician_id  INT,
  IN p_patient_id    INT,
  IN p_issue_date    DATE,
  IN p_notes         TEXT
)
BEGIN
  START TRANSACTION;
    INSERT INTO PRESCRIPTION
      (Prescribing_Physician_ID, Patient_ID, Issued_Date, Notes)
      VALUES (p_physician_id, p_patient_id, p_issue_date, p_notes);
    SELECT LAST_INSERT_ID() AS New_Prescription_ID;
  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_add_prescription_med$$
CREATE PROCEDURE sp_add_prescription_med (
  IN p_prescription_id INT,
  IN p_medication_id   INT,
  IN p_dosage          VARCHAR(50),
  IN p_frequency       VARCHAR(50),
  IN p_refills         INT
)
BEGIN
  INSERT INTO PRESCRIPTION_MEDICATION
    (Prescription_ID, Medication_ID, Dosage, Frequency, Refills)
    VALUES (p_prescription_id, p_medication_id, p_dosage, p_frequency, COALESCE(p_refills,0));
END$$

DROP PROCEDURE IF EXISTS sp_add_soap_entry$$
CREATE PROCEDURE sp_add_soap_entry (
  IN p_patient_id   INT,
  IN p_physician_id INT,
  IN p_note_dt      DATETIME,
  IN p_subj         TEXT,
  IN p_obj          TEXT,
  IN p_assessment   TEXT,
  IN p_plan         TEXT
)
BEGIN
  INSERT INTO SOAP_ENTRIES
    (Patient_ID, Physician_ID, Note_DateTime,
     Subjective, Objective, Assessment, Plan)
    VALUES (p_patient_id, p_physician_id, p_note_dt,
            p_subj, p_obj, p_assessment, p_plan);
END$$

DROP PROCEDURE IF EXISTS sp_place_order$$
CREATE PROCEDURE sp_place_order (
  IN p_physician_id    INT,
  IN p_patient_id      INT,
  IN p_prescription_id INT,
  IN p_order_type      VARCHAR(50),
  IN p_description     TEXT
)
BEGIN
  INSERT INTO ORDERS
    (Ordering_Physician_ID, Patient_ID, Prescription_ID,
     Order_Type, Order_Description, Order_Date)
    VALUES (p_physician_id, p_patient_id, p_prescription_id,
            p_order_type, p_description, CURDATE());
END$$

DROP PROCEDURE IF EXISTS sp_update_order_status$$
CREATE PROCEDURE sp_update_order_status (
  IN p_order_id   INT,
  IN p_new_status VARCHAR(50)
)
BEGIN
  UPDATE ORDERS
    SET Order_Status    = p_new_status,
        Completion_Date = IF(p_new_status = 'Completed', CURDATE(), Completion_Date)
   WHERE Order_ID = p_order_id;
END$$

DROP PROCEDURE IF EXISTS sp_generate_bill$$
CREATE PROCEDURE sp_generate_bill (
  IN p_patient_id    INT,
  IN p_total_charges DECIMAL(10,2),
  IN p_patient_resp  DECIMAL(10,2),
  IN p_bill_date     DATE
)
BEGIN
  START TRANSACTION;
    INSERT INTO BILLING
      (Patient_ID, Total_Charges, Patient_Responsibility, Bill_Date)
      VALUES (p_patient_id, p_total_charges, p_patient_resp, p_bill_date);
    SELECT LAST_INSERT_ID() AS New_Bill_ID;
  COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_record_payment$$
CREATE PROCEDURE sp_record_payment (
  IN p_bill_id   INT,
  IN p_pay_date  DATE,
  IN p_amount    DECIMAL(10,2),
  IN p_method    VARCHAR(50)
)
BEGIN
  INSERT INTO PAYMENT
    (Bill_ID, Payment_Date, Payment_Amount, Payment_Method)
    VALUES (p_bill_id, p_pay_date, p_amount, p_method);
END$$

DROP PROCEDURE IF EXISTS sp_file_insurance_claim$$
CREATE PROCEDURE sp_file_insurance_claim (
  IN p_bill_id      INT,
  IN p_insurance_id INT,
  IN p_claim_date   DATE,
  IN p_amt_claimed  DECIMAL(10,2)
)
BEGIN
  INSERT INTO INSURANCE_CLAIM
    (Bill_ID, Insurance_ID, Claim_Date, Amount_Claimed)
    VALUES (p_bill_id, p_insurance_id, p_claim_date, p_amt_claimed);
END$$

DROP PROCEDURE IF EXISTS sp_update_claim_status$$
CREATE PROCEDURE sp_update_claim_status (
  IN p_claim_id     INT,
  IN p_status       VARCHAR(50),
  IN p_amt_approved DECIMAL(10,2),
  IN p_paid_to_prov DECIMAL(10,2)
)
BEGIN
  UPDATE INSURANCE_CLAIM
    SET Claim_Status     = p_status,
        Amount_Approved  = p_amt_approved,
        Paid_To_Provider = p_paid_to_prov
   WHERE Claim_ID = p_claim_id;
END$$

DROP PROCEDURE IF EXISTS sp_patient_balance$$
CREATE PROCEDURE sp_patient_balance (
  IN p_patient_id INT
)
BEGIN
  SELECT b.Patient_ID,
         SUM(b.Total_Charges)             AS Total_Charges,
         IFNULL(SUM(ic.Paid_To_Provider),0) AS Insurance_Paid,
         IFNULL(SUM(p.Payment_Amount),0)    AS Patient_Paid,
         SUM(b.Total_Charges)
           - IFNULL(SUM(ic.Paid_To_Provider),0)
           - IFNULL(SUM(p.Payment_Amount),0) AS Outstanding
    FROM BILLING b
    LEFT JOIN INSURANCE_CLAIM ic ON ic.Bill_ID = b.Bill_ID
    LEFT JOIN PAYMENT p          ON p.Bill_ID   = b.Bill_ID
   WHERE b.Patient_ID = p_patient_id
   GROUP BY b.Patient_ID;
END$$

DELIMITER ;

-- ===================================================================
-- Grouping Three: Pharmacy, Lab
-- ===================================================================

DELIMITER $$

CREATE PROCEDURE sp_addPharmacist (
    IN p_First_Name VARCHAR(50),
    IN p_Last_Name VARCHAR(50),
    IN p_Email VARCHAR(100),
    IN p_Phone VARCHAR(20)
)
BEGIN
    INSERT INTO PHARMACIST (First_Name, Last_Name, Email, Phone)
    VALUES (p_First_Name, p_Last_Name, p_Email, p_Phone);
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_addLabTechnician (
    IN p_First_Name VARCHAR(50),
    IN p_Last_Name VARCHAR(50),
    IN p_Email VARCHAR(100),
    IN p_Phone VARCHAR(20)
)
BEGIN
    INSERT INTO LAB_TECHNICIAN (First_Name, Last_Name, Email, Phone)
    VALUES (p_First_Name, p_Last_Name, p_Email, p_Phone);
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_addLabTest (
    IN p_Patient_ID INT,
    IN p_Physician_ID INT,
    IN p_Technician_ID INT,
    IN p_Test_Type VARCHAR(100),
    IN p_Date_Ordered DATE
)
BEGIN
    INSERT INTO LAB_TEST (Patient_ID, Physician_ID, Technician_ID, Test_Type, Result_Status, Date_Ordered)
    VALUES (p_Patient_ID, p_Physician_ID, p_Technician_ID, p_Test_Type, 'Pending', p_Date_Ordered);

    INSERT INTO NOTIFICATION (Sender_ID, Receiver_ID, Message)
    VALUES (p_Technician_ID, p_Physician_ID, CONCAT('Lab Test Ordered: ', p_Test_Type, ' for Patient ID ', p_Patient_ID));
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_updateLabTestResults (
    IN p_LabTest_ID INT,
    IN p_Test_Results TEXT,
    IN p_Date_Completed DATE
)
BEGIN
    DECLARE v_Patient_ID INT;
    DECLARE v_Physician_ID INT;

    UPDATE LAB_TEST
    SET Test_Results = p_Test_Results,
        Result_Status = 'Completed',
        Date_Completed = p_Date_Completed
    WHERE LabTest_ID = p_LabTest_ID;

    SELECT Patient_ID, Physician_ID
    INTO v_Patient_ID, v_Physician_ID
    FROM LAB_TEST
    WHERE LabTest_ID = p_LabTest_ID;

    INSERT INTO NOTIFICATION (Sender_ID, Receiver_ID, Message)
    VALUES (v_Physician_ID, v_Patient_ID, CONCAT('Lab Test Result Available: ', p_Test_Results));
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_addNotification (
    IN p_Sender_ID INT,
    IN p_Receiver_ID INT,
    IN p_Message TEXT
)
BEGIN
    INSERT INTO NOTIFICATION (Sender_ID, Receiver_ID, Message)
    VALUES (p_Sender_ID, p_Receiver_ID, p_Message);
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_getAllNotificationsForUser (
    IN p_User_ID INT
)
BEGIN
    SELECT Notification_ID, Sender_ID, Receiver_ID, Message, Timestamp
    FROM NOTIFICATION
    WHERE Receiver_ID = p_User_ID
    ORDER BY Timestamp DESC;
END $$

DELIMITER ;

-- ===================================================================
--assign bed, discharge log
-- ===================================================================
DELIMITER $$

CREATE PROCEDURE sp_assignBedToPatient (
    IN p_Bed_ID INT,
    IN p_Patient_ID INT,
    IN p_Assigned_Date DATE
)
BEGIN
  IF (SELECT Status FROM BED WHERE Bed_ID = p_Bed_ID) = 'Available' THEN
    INSERT INTO BED_ASSIGNMENT (Bed_ID, Patient_ID, Assigned_Date)
    VALUES (p_Bed_ID, p_Patient_ID, p_Assigned_Date);

    UPDATE BED SET Status = 'Occupied' WHERE Bed_ID = p_Bed_ID;
  ELSE
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Bed is already occupied.';
  END IF;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_dischargePatient (
    IN p_Patient_ID INT,
    IN p_Physician_ID INT,
    IN p_Discharge_Date DATE,
    IN p_Summary TEXT
)
BEGIN
  INSERT INTO DISCHARGE_LOG (Patient_ID, Physician_ID, Discharge_Date, Summary)
  VALUES (p_Patient_ID, p_Physician_ID, p_Discharge_Date, p_Summary);

  UPDATE BED_ASSIGNMENT
  SET Released_Date = p_Discharge_Date
  WHERE Patient_ID = p_Patient_ID AND Released_Date IS NULL;

  UPDATE BED
  SET Status = 'Available'
  WHERE Bed_ID IN (
    SELECT Bed_ID FROM BED_ASSIGNMENT
    WHERE Patient_ID = p_Patient_ID AND Released_Date = p_Discharge_Date
  );
END $$

DELIMITER ;
