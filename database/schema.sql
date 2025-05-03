-- 1) Create the database (if it doesn't exist) and switch to it
CREATE DATABASE IF NOT EXISTS HMSS_DB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE HMSS_DB;

-- ==================================================================
-- Grouping One: Core User & Item Tables (MySQL syntax & collation)
-- ==================================================================

CREATE TABLE IF NOT EXISTS Users (
  Id                  INT            AUTO_INCREMENT PRIMARY KEY,
  Username            VARCHAR(100)   NOT NULL UNIQUE,
  PasswordHash        VARCHAR(200)   NOT NULL,
  Roles               VARCHAR(200)   NOT NULL DEFAULT 'patient',
  SecurityQuestion    VARCHAR(255)   NULL,  -- e.g. 'What was your first pet’s name?'
  SecurityAnswerHash  VARCHAR(200)   NULL   -- bcrypt hash of the answer
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Items (
  Id     INT          AUTO_INCREMENT PRIMARY KEY,
  UserId INT          NOT NULL,
  Name   VARCHAR(100) NOT NULL,
  FOREIGN KEY (UserId)
    REFERENCES Users(Id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- Grouping Two: Clinical Documentation & Reference Data
-- (already MySQL/InnoDB, add explicit collation for consistency)
-- ==================================================================

CREATE TABLE IF NOT EXISTS PATIENT (
    Patient_ID      INT          NOT NULL AUTO_INCREMENT,
    First_Name      VARCHAR(50)  NOT NULL,
    Last_Name       VARCHAR(50)  NOT NULL,
    Date_Of_Birth   DATE,
    PRIMARY KEY (Patient_ID)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PHYSICIAN (
    Physician_ID    INT          NOT NULL AUTO_INCREMENT,
    First_Name      VARCHAR(50)  NOT NULL,
    Last_Name       VARCHAR(50)  NOT NULL,
    Role            VARCHAR(50),            -- e.g., 'Cardiologist'
    PRIMARY KEY (Physician_ID)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MEDICATION (
    Medication_ID     INT           NOT NULL AUTO_INCREMENT,
    Medication_Name   VARCHAR(100)  NOT NULL,
    Form              VARCHAR(30),             -- tablet, syrup, …
    Strength          VARCHAR(30),             -- 500 mg, 10 mL, …
    CONSTRAINT uk_med_name UNIQUE (Medication_Name),
    PRIMARY KEY (Medication_ID)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PRESCRIPTION (
    Prescription_ID            INT          NOT NULL AUTO_INCREMENT,
    Prescribing_Physician_ID   INT          NOT NULL,
    Patient_ID                 INT          NOT NULL,
    Issued_Date                DATE         NOT NULL,
    Notes                      TEXT,
    PRIMARY KEY (Prescription_ID),
    CONSTRAINT fk_presc_physician
        FOREIGN KEY (Prescribing_Physician_ID)
        REFERENCES PHYSICIAN (Physician_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_presc_patient
        FOREIGN KEY (Patient_ID)
        REFERENCES PATIENT (Patient_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PRESCRIPTION_MEDICATION (
    Prescription_ID   INT          NOT NULL,
    Medication_ID     INT          NOT NULL,
    Dosage            VARCHAR(50),
    Frequency         VARCHAR(50),
    Refills           INT          DEFAULT 0,
    PRIMARY KEY (Prescription_ID, Medication_ID),
    CONSTRAINT fk_pm_prescription
        FOREIGN KEY (Prescription_ID)
        REFERENCES PRESCRIPTION (Prescription_ID)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_pm_medication
        FOREIGN KEY (Medication_ID)
        REFERENCES MEDICATION (Medication_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS SOAP_ENTRIES (
    SOAP_ID        INT          NOT NULL AUTO_INCREMENT,
    Patient_ID     INT          NOT NULL,
    Physician_ID   INT          NOT NULL,
    Note_DateTime  DATETIME     NOT NULL,
    Subjective     TEXT,
    Objective      TEXT,
    Assessment     TEXT,
    Plan           TEXT,
    PRIMARY KEY (SOAP_ID),
    CONSTRAINT fk_soap_patient
        FOREIGN KEY (Patient_ID)
        REFERENCES PATIENT (Patient_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_soap_physician
        FOREIGN KEY (Physician_ID)
        REFERENCES PHYSICIAN (Physician_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_soap_patient_dt (Patient_ID, Note_DateTime)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ORDERS (
    Order_ID              INT          NOT NULL AUTO_INCREMENT,
    Ordering_Physician_ID INT          NOT NULL,
    Patient_ID            INT,
    Prescription_ID       INT,
    Order_Type            VARCHAR(50)  NOT NULL,
    Order_Description     TEXT,
    Order_Status          VARCHAR(50)  NOT NULL DEFAULT 'Pending',
    Order_Date            DATE         NOT NULL,
    Completion_Date       DATE,
    PRIMARY KEY (Order_ID),
    CONSTRAINT fk_orders_physician
        FOREIGN KEY (Ordering_Physician_ID)
        REFERENCES PHYSICIAN (Physician_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_orders_patient
        FOREIGN KEY (Patient_ID)
        REFERENCES PATIENT (Patient_ID)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_orders_prescription
        FOREIGN KEY (Prescription_ID)
        REFERENCES PRESCRIPTION (Prescription_ID)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- Grouping Three: Financial Tables
-- ==================================================================

CREATE TABLE IF NOT EXISTS BILLING (
    Bill_ID                 INT           NOT NULL AUTO_INCREMENT,
    Patient_ID              INT           NOT NULL,
    Total_Charges           DECIMAL(10,2) NOT NULL,
    Patient_Responsibility  DECIMAL(10,2) NOT NULL,
    Bill_Date               DATE          NOT NULL,
    PRIMARY KEY (Bill_ID),
    CONSTRAINT fk_billing_patient
        FOREIGN KEY (Patient_ID)
        REFERENCES PATIENT (Patient_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS INSURANCE (
    Insurance_ID      INT           NOT NULL AUTO_INCREMENT,
    Patient_ID        INT           NOT NULL,
    Insurance_Provider VARCHAR(100) NOT NULL,
    Policy_Number      VARCHAR(100) NOT NULL,
    Plan_Type          VARCHAR(50),
    Effective_Date     DATE         NOT NULL,
    Expiration_Date    DATE,
    Copay              DECIMAL(10,2) DEFAULT 0,
    Deductible         DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Insurance_ID),
    INDEX idx_insurance_patient (Patient_ID),
    CONSTRAINT fk_insurance_patient
        FOREIGN KEY (Patient_ID)
        REFERENCES PATIENT (Patient_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS INSURANCE_CLAIM (
    Claim_ID          INT           NOT NULL AUTO_INCREMENT,
    Bill_ID           INT           NOT NULL,
    Insurance_ID      INT           NOT NULL,
    Claim_Date        DATE          NOT NULL,
    Claim_Status      VARCHAR(50)   DEFAULT 'Submitted',
    Amount_Claimed    DECIMAL(10,2),
    Amount_Approved   DECIMAL(10,2),
    Paid_To_Provider  DECIMAL(10,2),
    PRIMARY KEY (Claim_ID),
    CONSTRAINT fk_claim_bill
        FOREIGN KEY (Bill_ID)
        REFERENCES BILLING (Bill_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_claim_insurance
        FOREIGN KEY (Insurance_ID)
        REFERENCES INSURANCE (Insurance_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PAYMENT (
    Payment_ID      INT           NOT NULL AUTO_INCREMENT,
    Bill_ID         INT           NOT NULL,
    Payment_Date    DATE          NOT NULL,
    Payment_Amount  DECIMAL(10,2) NOT NULL,
    Payment_Method  VARCHAR(50)   NOT NULL,
    PRIMARY KEY (Payment_ID),
    CONSTRAINT fk_payment_bill
        FOREIGN KEY (Bill_ID)
        REFERENCES BILLING (Bill_ID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

/*-----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping Three
-----------------------------------------------------------------------------------------------------------------------------------------------------------------*/
-- ==================================================================
-- Grouping: Pharmacy, Lab, and Notification Modules (g, h, i)
-- ==================================================================

-- PHARMACIST: Stores pharmacist contact details
CREATE TABLE IF NOT EXISTS PHARMACIST (
    Pharmacist_ID   INT AUTO_INCREMENT PRIMARY KEY,
    First_Name      VARCHAR(50) NOT NULL,
    Last_Name       VARCHAR(50) NOT NULL,
    Email           VARCHAR(100) UNIQUE,
    Phone           VARCHAR(20) UNIQUE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- LAB_TECHNICIAN: Stores lab technician contact info
CREATE TABLE IF NOT EXISTS LAB_TECHNICIAN (
    Technician_ID   INT AUTO_INCREMENT PRIMARY KEY,
    First_Name      VARCHAR(50) NOT NULL,
    Last_Name       VARCHAR(50) NOT NULL,
    Email           VARCHAR(100) UNIQUE,
    Phone           VARCHAR(20) UNIQUE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- LAB_TEST: Stores test requests and results
CREATE TABLE IF NOT EXISTS LAB_TEST (
    LabTest_ID      INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID      INT NOT NULL,
    Physician_ID    INT NOT NULL,
    Technician_ID   INT,
    Test_Type       VARCHAR(100) NOT NULL,
    Test_Results    TEXT,
    Result_Status   ENUM('Pending', 'Completed') DEFAULT 'Pending',
    Date_Ordered    DATE NOT NULL,
    Date_Completed  DATE,
    FOREIGN KEY (Patient_ID) REFERENCES PATIENT(Patient_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (Physician_ID) REFERENCES PHYSICIAN(Physician_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (Technician_ID) REFERENCES LAB_TECHNICIAN(Technician_ID)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- NOTIFICATION: Stores messages sent between users
CREATE TABLE IF NOT EXISTS NOTIFICATION (
    Notification_ID INT AUTO_INCREMENT PRIMARY KEY,
    Sender_ID       INT NOT NULL,
    Receiver_ID     INT NOT NULL,
    Message         TEXT NOT NULL,
    Timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Sender_ID) REFERENCES Users(Id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (Receiver_ID) REFERENCES Users(Id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

/*-----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping: Pharmacy, Lab, and Notification Modules (g, h, i)
-----------------------------------------------------------------------------------------------------------------------------------------------------------------*/

-- ==================================================================
-- bed info
-- ==================================================================

CREATE TABLE IF NOT EXISTS BED (
  Bed_ID INT AUTO_INCREMENT PRIMARY KEY,
  Bed_Number VARCHAR(10) UNIQUE NOT NULL,
  Ward VARCHAR(50),
  Status ENUM('Available', 'Occupied') DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS BED_ASSIGNMENT (
  Assignment_ID INT AUTO_INCREMENT PRIMARY KEY,
  Bed_ID INT NOT NULL,
  Patient_ID INT NOT NULL,
  Assigned_Date DATE NOT NULL,
  Released_Date DATE,
  FOREIGN KEY (Bed_ID) REFERENCES BED(Bed_ID),
  FOREIGN KEY (Patient_ID) REFERENCES PATIENT(Patient_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DISCHARGE_LOG (
  Discharge_ID INT AUTO_INCREMENT PRIMARY KEY,
  Patient_ID INT NOT NULL,
  Physician_ID INT NOT NULL,
  Discharge_Date DATE NOT NULL,
  Summary TEXT,
  FOREIGN KEY (Patient_ID) REFERENCES PATIENT(Patient_ID),
  FOREIGN KEY (Physician_ID) REFERENCES PHYSICIAN(Physician_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- End of bed info
