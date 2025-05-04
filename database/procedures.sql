-- Switch to the target database
CREATE DATABASE IF NOT EXISTS HMSS_DB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE HMSS_DB;


-- ===================================================================
-- Grouping One: User Management Stored Procedures
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
-- Grouping One-B: Profile Management Procedures
-- ===================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS spGetPatientProfile$$
CREATE PROCEDURE spGetPatientProfile (
  IN p_user_id INT
)
BEGIN
  SELECT *
    FROM PATIENT
   WHERE User_Id = p_user_id;
END$$

DROP PROCEDURE IF EXISTS spUpdatePatientProfile$$
CREATE PROCEDURE spUpdatePatientProfile (
  IN p_user_id                   INT,
  IN p_first_name                VARCHAR(50),
  IN p_last_name                 VARCHAR(50),
  IN p_Date_Of_Birth             DATE,
  IN p_Medical_Record_Number     VARCHAR(50),
  IN p_Gender                    ENUM('Male','Female','Other'),
  IN p_Contact_Phone             VARCHAR(20),
  IN p_Contact_Email             VARCHAR(100),
  IN p_Home_Address              VARCHAR(255),
  IN p_Primary_Care_Physician    VARCHAR(100),
  IN p_Insurance_Provider        VARCHAR(100),
  IN p_Insurance_Policy_Number   VARCHAR(100),
  IN p_Emergency_Contact_Name    VARCHAR(100),
  IN p_Emergency_Contact_Rel     VARCHAR(50),
  IN p_Known_Allergies           TEXT
)
BEGIN
  UPDATE PATIENT
     SET First_Name              = p_first_name,
         Last_Name               = p_last_name,
         Date_Of_Birth            = p_Date_Of_Birth,
         Medical_Record_Number   = p_Medical_Record_Number,
         Gender                  = p_Gender,
         Contact_Phone           = p_Contact_Phone,
         Contact_Email           = p_Contact_Email,
         Home_Address            = p_Home_Address,
         Primary_Care_Physician  = p_Primary_Care_Physician,
         Insurance_Provider      = p_Insurance_Provider,
         Insurance_Policy_Number = p_Insurance_Policy_Number,
         Emergency_Contact_Name  = p_Emergency_Contact_Name,
         Emergency_Contact_Rel   = p_Emergency_Contact_Rel,
         Known_Allergies         = p_Known_Allergies
   WHERE User_Id = p_user_id;
END$$

DROP PROCEDURE IF EXISTS spGetPhysicianProfile$$
CREATE PROCEDURE spGetPhysicianProfile (
  IN p_user_id INT
)
BEGIN
  SELECT *
    FROM PHYSICIAN
   WHERE User_Id = p_user_id;
END$$

DROP PROCEDURE IF EXISTS spUpdatePhysicianProfile$$
CREATE PROCEDURE spUpdatePhysicianProfile (
  IN p_user_id                INT,
  IN p_first_name             VARCHAR(50),
  IN p_last_name              VARCHAR(50),
  IN p_Role                   VARCHAR(50),
  IN p_Medical_License_Number VARCHAR(50),
  IN p_Specialty              VARCHAR(100),
  IN p_Department             VARCHAR(100),
  IN p_Office_Location        VARCHAR(100),
  IN p_Contact_Phone          VARCHAR(20),
  IN p_Contact_Email          VARCHAR(100),
  IN p_Office_Hours           VARCHAR(100),
  IN p_Board_Certifications   VARCHAR(255),
  IN p_Education              TEXT,
  IN p_Professional_Bio       TEXT
)
BEGIN
  UPDATE PHYSICIAN
     SET First_Name             = p_first_name,
         Last_Name              = p_last_name,
         Role                   = p_Role,
         Medical_License_Number = p_Medical_License_Number,
         Specialty              = p_Specialty,
         Department             = p_Department,
         Office_Location        = p_Office_Location,
         Contact_Phone          = p_Contact_Phone,
         Contact_Email          = p_Contact_Email,
         Office_Hours           = p_Office_Hours,
         Board_Certifications   = p_Board_Certifications,
         Education              = p_Education,
         Professional_Bio       = p_Professional_Bio
   WHERE User_Id = p_user_id;
END$$

DROP PROCEDURE IF EXISTS spGetAdminProfile$$
CREATE PROCEDURE spGetAdminProfile (
  IN p_user_id INT
)
BEGIN
  SELECT *
    FROM ADMIN_PROFILE
   WHERE User_Id = p_user_id;
END$$

DROP PROCEDURE IF EXISTS spUpdateAdminProfile$$
CREATE PROCEDURE spUpdateAdminProfile (
  IN p_user_id           INT,
  IN p_first_name        VARCHAR(50),
  IN p_last_name         VARCHAR(50),
  IN p_Employee_ID       VARCHAR(50),
  IN p_Department        VARCHAR(100),
  IN p_Job_Title         VARCHAR(100),
  IN p_Contact_Phone     VARCHAR(20),
  IN p_Contact_Email     VARCHAR(100),
  IN p_Office_Location   VARCHAR(100),
  IN p_Permission_Level  VARCHAR(100),
  IN p_Work_Schedule     VARCHAR(100),
  IN p_Responsibilities  TEXT,
  IN p_Emergency_Contact VARCHAR(255)
)
BEGIN
  INSERT INTO ADMIN_PROFILE
    (User_Id, First_Name, Last_Name,
     Employee_ID, Department, Job_Title,
     Contact_Phone, Contact_Email, Office_Location,
     Permission_Level, Work_Schedule, Responsibilities,
     Emergency_Contact)
  VALUES
    (p_user_id, p_first_name, p_last_name,
     p_Employee_ID, p_Department, p_Job_Title,
     p_Contact_Phone, p_Contact_Email, p_Office_Location,
     p_Permission_Level, p_Work_Schedule, p_Responsibilities,
     p_Emergency_Contact)
  ON DUPLICATE KEY UPDATE
    First_Name        = VALUES(First_Name),
    Last_Name         = VALUES(Last_Name),
    Employee_ID       = VALUES(Employee_ID),
    Department        = VALUES(Department),
    Job_Title         = VALUES(Job_Title),
    Contact_Phone     = VALUES(Contact_Phone),
    Contact_Email     = VALUES(Contact_Email),
    Office_Location   = VALUES(Office_Location),
    Permission_Level  = VALUES(Permission_Level),
    Work_Schedule     = VALUES(Work_Schedule),
    Responsibilities  = VALUES(Responsibilities),
    Emergency_Contact = VALUES(Emergency_Contact);
END$$
DELIMITER ;

-- ===================================================================
-- Grouping Two: Clinical & Financial Procedures (MySQL/InnoDB)
-- ===================================================================
DELIMITER $$
-- (unchanged from your existing file…)
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

DROP PROCEDURE IF EXISTS sp_addPharmacist$$

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

DROP PROCEDURE IF EXISTS sp_addLabTechnician$$

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

DROP PROCEDURE IF EXISTS sp_addLabTest$$

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

DROP PROCEDURE IF EXISTS sp_updateLabTestResults$$

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

DROP PROCEDURE IF EXISTS sp_addNotification$$

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

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_getAllNotificationsForUser$$
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

-- assign bed, discharge log

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_assignBedToPatient$$
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

DROP PROCEDURE IF EXISTS sp_dischargePatient$$
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
-- 4.3 After Visit Summary-SOAP (Retrieval)
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_getSOAPEntries$$
CREATE PROCEDURE sp_getSOAPEntries (
    IN p_Patient_ID INT,
    IN p_StartDate DATE,
    IN p_EndDate DATE
)
BEGIN
    SELECT 
        s.SOAP_ID,
        s.Patient_ID,
        s.Physician_ID,
        s.Note_DateTime,
        s.Subjective,
        s.Objective,
        s.Assessment,
        s.Plan,
        CONCAT(p.First_Name, ' ', p.Last_Name) as Patient_Name,
        CONCAT(ph.First_Name, ' ', ph.Last_Name) as Physician_Name
    FROM SOAP_ENTRIES s
    JOIN PATIENT p ON s.Patient_ID = p.Patient_ID
    JOIN PHYSICIAN ph ON s.Physician_ID = ph.Physician_ID
    WHERE s.Patient_ID = p_Patient_ID
    AND DATE(s.Note_DateTime) BETWEEN p_StartDate AND p_EndDate
    ORDER BY s.Note_DateTime DESC;
END $$

DROP PROCEDURE IF EXISTS sp_getLatestSOAPEntry$$
CREATE PROCEDURE sp_getLatestSOAPEntry (
    IN p_Patient_ID INT
)
BEGIN
    SELECT 
        s.SOAP_ID,
        s.Patient_ID,
        s.Physician_ID,
        s.Note_DateTime,
        s.Subjective,
        s.Objective,
        s.Assessment,
        s.Plan,
        CONCAT(p.First_Name, ' ', p.Last_Name) as Patient_Name,
        CONCAT(ph.First_Name, ' ', ph.Last_Name) as Physician_Name
    FROM SOAP_ENTRIES s
    JOIN PATIENT p ON s.Patient_ID = p.Patient_ID
    JOIN PHYSICIAN ph ON s.Physician_ID = ph.Physician_ID
    WHERE s.Patient_ID = p_Patient_ID
    ORDER BY s.Note_DateTime DESC
    LIMIT 1;
END $$

DELIMITER ;

-- 4.4 Prescribe Labs tests (Enhanced)
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_addLabTestWithNotification$$
CREATE PROCEDURE sp_addLabTestWithNotification (
    IN p_Patient_ID INT,
    IN p_Physician_ID INT,
    IN p_Test_Type VARCHAR(100),
    IN p_Date_Ordered DATE,
    IN p_Urgency VARCHAR(20) -- 'Routine', 'Urgent', 'STAT'
)
BEGIN
    DECLARE v_LabTest_ID INT;
    DECLARE v_Patient_Name VARCHAR(100);
    DECLARE v_Physician_Name VARCHAR(100);
    
    -- Insert lab test
    INSERT INTO LAB_TEST (Patient_ID, Physician_ID, Test_Type, Result_Status, Date_Ordered)
    VALUES (p_Patient_ID, p_Physician_ID, p_Test_Type, 'Pending', p_Date_Ordered);
    
    SET v_LabTest_ID = LAST_INSERT_ID();
    
    -- Get names for notification
    SELECT CONCAT(First_Name, ' ', Last_Name) INTO v_Patient_Name
    FROM PATIENT WHERE Patient_ID = p_Patient_ID;
    
    SELECT CONCAT(First_Name, ' ', Last_Name) INTO v_Physician_Name
    FROM PHYSICIAN WHERE Physician_ID = p_Physician_ID;
    
    -- Notify patient
    INSERT INTO NOTIFICATION (Sender_ID, Receiver_ID, Message)
    SELECT ph.User_Id, p.User_Id, 
           CONCAT('Lab Test Ordered: ', p_Test_Type, ' (', p_Urgency, ') by Dr. ', v_Physician_Name)
    FROM PHYSICIAN ph
    JOIN PATIENT p ON p.Patient_ID = p_Patient_ID
    WHERE ph.Physician_ID = p_Physician_ID;
    
    -- Notify lab technicians
    INSERT INTO NOTIFICATION (Sender_ID, Receiver_ID, Message)
    SELECT ph.User_Id, u.Id,
           CONCAT('New ', p_Urgency, ' Lab Test: ', p_Test_Type, ' for patient ', v_Patient_Name)
    FROM PHYSICIAN ph
    CROSS JOIN Users u
    WHERE ph.Physician_ID = p_Physician_ID
    AND u.Roles LIKE '%lab_technician%';
    
    SELECT v_LabTest_ID as New_LabTest_ID;
END $$

DROP PROCEDURE IF EXISTS sp_getPatientLabTests$$
CREATE PROCEDURE sp_getPatientLabTests (
    IN p_Patient_ID INT
)
BEGIN
    SELECT 
        lt.LabTest_ID,
        lt.Test_Type,
        lt.Date_Ordered,
        lt.Date_Completed,
        lt.Result_Status,
        lt.Test_Results,
        CONCAT(ph.First_Name, ' ', ph.Last_Name) as Ordering_Physician,
        CONCAT(t.First_Name, ' ', t.Last_Name) as Technician
    FROM LAB_TEST lt
    JOIN PHYSICIAN ph ON lt.Physician_ID = ph.Physician_ID
    LEFT JOIN LAB_TECHNICIAN t ON lt.Technician_ID = t.Technician_ID
    WHERE lt.Patient_ID = p_Patient_ID
    ORDER BY lt.Date_Ordered DESC;
END $$

DELIMITER ;

-- 4.5 Prescribe Meds (Enhanced)
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_prescribeMedication$$
CREATE PROCEDURE sp_prescribeMedication (
    IN p_Physician_ID INT,
    IN p_Patient_ID INT,
    IN p_Medication_Name VARCHAR(100),
    IN p_Dosage VARCHAR(50),
    IN p_Frequency VARCHAR(50),
    IN p_Refills INT,
    IN p_Notes TEXT
)
BEGIN
    DECLARE v_Prescription_ID INT;
    DECLARE v_Medication_ID INT;
    DECLARE v_Patient_Name VARCHAR(100);
    
    -- Check if medication exists, if not create it
    SELECT Medication_ID INTO v_Medication_ID
    FROM MEDICATION
    WHERE Medication_Name = p_Medication_Name
    LIMIT 1;
    
    IF v_Medication_ID IS NULL THEN
        INSERT INTO MEDICATION (Medication_Name)
        VALUES (p_Medication_Name);
        SET v_Medication_ID = LAST_INSERT_ID();
    END IF;
    
    -- Create prescription
    INSERT INTO PRESCRIPTION (Prescribing_Physician_ID, Patient_ID, Issued_Date, Notes)
    VALUES (p_Physician_ID, p_Patient_ID, CURDATE(), p_Notes);
    
    SET v_Prescription_ID = LAST_INSERT_ID();
    
    -- Add medication to prescription
    INSERT INTO PRESCRIPTION_MEDICATION 
        (Prescription_ID, Medication_ID, Dosage, Frequency, Refills)
    VALUES 
        (v_Prescription_ID, v_Medication_ID, p_Dosage, p_Frequency, p_Refills);
    
    -- Get patient name for notification
    SELECT CONCAT(First_Name, ' ', Last_Name) INTO v_Patient_Name
    FROM PATIENT WHERE Patient_ID = p_Patient_ID;
    
    -- Notify patient
    INSERT INTO NOTIFICATION (Sender_ID, Receiver_ID, Message)
    SELECT ph.User_Id, p.User_Id,
           CONCAT('New prescription: ', p_Medication_Name, ' - ', p_Dosage, ', ', p_Frequency)
    FROM PHYSICIAN ph
    JOIN PATIENT p ON p.Patient_ID = p_Patient_ID
    WHERE ph.Physician_ID = p_Physician_ID;
    
    -- Notify pharmacists
    INSERT INTO NOTIFICATION (Sender_ID, Receiver_ID, Message)
    SELECT ph.User_Id, u.Id,
           CONCAT('New prescription for ', v_Patient_Name, ': ', p_Medication_Name)
    FROM PHYSICIAN ph
    CROSS JOIN Users u
    WHERE ph.Physician_ID = p_Physician_ID
    AND u.Roles LIKE '%pharmacist%';
    
    SELECT v_Prescription_ID as New_Prescription_ID;
END $$

DROP PROCEDURE IF EXISTS sp_getPatientPrescriptions$$
CREATE PROCEDURE sp_getPatientPrescriptions (
    IN p_Patient_ID INT
)
BEGIN
    SELECT 
        p.Prescription_ID,
        p.Issued_Date,
        p.Notes,
        CONCAT(ph.First_Name, ' ', ph.Last_Name) as Prescribing_Physician,
        m.Medication_Name,
        pm.Dosage,
        pm.Frequency,
        pm.Refills
    FROM PRESCRIPTION p
    JOIN PHYSICIAN ph ON p.Prescribing_Physician_ID = ph.Physician_ID
    JOIN PRESCRIPTION_MEDICATION pm ON p.Prescription_ID = pm.Prescription_ID
    JOIN MEDICATION m ON pm.Medication_ID = m.Medication_ID
    WHERE p.Patient_ID = p_Patient_ID
    ORDER BY p.Issued_Date DESC;
END $$

DELIMITER ;

-- Additional Helper Procedures
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_getAvailableBeds$$
CREATE PROCEDURE sp_getAvailableBeds()
BEGIN
    SELECT 
        Bed_ID,
        Bed_Number,
        Ward,
        Status
    FROM BED
    WHERE Status = 'Available'
    ORDER BY Ward, Bed_Number;
END $$

DROP PROCEDURE IF EXISTS sp_getPatientCurrentBed$$
CREATE PROCEDURE sp_getPatientCurrentBed (
    IN p_Patient_ID INT
)
BEGIN
    SELECT 
        b.Bed_ID,
        b.Bed_Number,
        b.Ward,
        ba.Assigned_Date
    FROM BED b
    JOIN BED_ASSIGNMENT ba ON b.Bed_ID = ba.Bed_ID
    WHERE ba.Patient_ID = p_Patient_ID
    AND ba.Released_Date IS NULL;
END $$

DROP PROCEDURE IF EXISTS sp_getPhysicianPatients$$
CREATE PROCEDURE sp_getPhysicianPatients (
    IN p_Physician_ID INT
)
BEGIN
    SELECT DISTINCT
        p.Patient_ID,
        CONCAT(p.First_Name, ' ', p.Last_Name) as Patient_Name,
        p.Date_Of_Birth,
        p.Medical_Record_Number,
        p.Contact_Phone,
        p.Contact_Email
    FROM PATIENT p
    WHERE p.Patient_ID IN (
        SELECT Patient_ID FROM PRESCRIPTION WHERE Prescribing_Physician_ID = p_Physician_ID
        UNION
        SELECT Patient_ID FROM SOAP_ENTRIES WHERE Physician_ID = p_Physician_ID
        UNION
        SELECT Patient_ID FROM LAB_TEST WHERE Physician_ID = p_Physician_ID
    )
    ORDER BY p.Last_Name, p.First_Name;
END $$

DELIMITER ;