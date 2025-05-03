-- ================================================
-- 1) Create (or reuse) the HMSS_DB database
-- ================================================
CREATE DATABASE IF NOT EXISTS HMSS_DB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE HMSS_DB;

-- ================================================
-- 2) Core user & item tables
-- ================================================
CREATE TABLE IF NOT EXISTS `Users` (
  `Id`                 INT            NOT NULL AUTO_INCREMENT,
  `Username`           VARCHAR(100)   NOT NULL UNIQUE,
  `PasswordHash`       VARCHAR(200)   NOT NULL,
  `Roles`              VARCHAR(200)   NOT NULL DEFAULT 'patient',
  `SecurityQuestion`   VARCHAR(255)   NULL,
  `SecurityAnswerHash` VARCHAR(200)   NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Items` (
  `Id`     INT          NOT NULL AUTO_INCREMENT,
  `UserId` INT          NOT NULL,
  `Name`   VARCHAR(100) NOT NULL,
  PRIMARY KEY (`Id`),
  FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 3) Patient profile (one-to-one with Users)
-- ================================================
CREATE TABLE IF NOT EXISTS `PATIENT` (
  `Patient_ID`              INT            NOT NULL AUTO_INCREMENT,
  `User_Id`                 INT            NOT NULL UNIQUE,
  `First_Name`              VARCHAR(50)    NOT NULL,
  `Last_Name`               VARCHAR(50)    NOT NULL,
  `Date_Of_Birth`           DATE           NULL,
  `Medical_Record_Number`   VARCHAR(50)    NULL,
  `Gender`                  ENUM('Male','Female','Other') NULL,
  `Contact_Phone`           VARCHAR(20)    NULL,
  `Contact_Email`           VARCHAR(100)   NULL,
  `Home_Address`            VARCHAR(255)   NULL,
  `Primary_Care_Physician`  VARCHAR(100)   NULL,
  `Insurance_Provider`      VARCHAR(100)   NULL,
  `Insurance_Policy_Number` VARCHAR(100)   NULL,
  `Emergency_Contact_Name`  VARCHAR(100)   NULL,
  `Emergency_Contact_Rel`   VARCHAR(50)    NULL,
  `Known_Allergies`         TEXT           NULL,
  PRIMARY KEY (`Patient_ID`),
  FOREIGN KEY (`User_Id`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 4) Physician profile (one-to-one with Users)
-- ================================================
CREATE TABLE IF NOT EXISTS `PHYSICIAN` (
  `Physician_ID`           INT            NOT NULL AUTO_INCREMENT,
  `User_Id`                INT            NOT NULL UNIQUE,
  `First_Name`             VARCHAR(50)    NOT NULL,
  `Last_Name`              VARCHAR(50)    NOT NULL,
  `Role`                   VARCHAR(50)    NULL,
  `Medical_License_Number` VARCHAR(50)    NULL,
  `Specialty`              VARCHAR(100)   NULL,
  `Department`             VARCHAR(100)   NULL,
  `Office_Location`        VARCHAR(100)   NULL,
  `Contact_Phone`          VARCHAR(20)    NULL,
  `Contact_Email`          VARCHAR(100)   NULL,
  `Office_Hours`           VARCHAR(100)   NULL,
  `Board_Certifications`   VARCHAR(255)   NULL,
  `Education`              TEXT           NULL,
  `Professional_Bio`       TEXT           NULL,
  PRIMARY KEY (`Physician_ID`),
  FOREIGN KEY (`User_Id`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 5) Admin profile (one-to-one with Users)
-- ================================================
CREATE TABLE IF NOT EXISTS `ADMIN_PROFILE` (
  `Admin_ID`            INT            NOT NULL AUTO_INCREMENT,
  `User_Id`             INT            NOT NULL UNIQUE,
  `First_Name`          VARCHAR(50)    NOT NULL,
  `Last_Name`           VARCHAR(50)    NOT NULL,
  `Employee_ID`         VARCHAR(50)    NULL,
  `Department`          VARCHAR(100)   NULL,
  `Job_Title`           VARCHAR(100)   NULL,
  `Contact_Phone`       VARCHAR(20)    NULL,
  `Contact_Email`       VARCHAR(100)   NULL,
  `Office_Location`     VARCHAR(100)   NULL,
  `Permission_Level`    VARCHAR(100)   NULL,
  `Work_Schedule`       VARCHAR(100)   NULL,
  `Responsibilities`    TEXT           NULL,
  `Emergency_Contact`   VARCHAR(255)   NULL,
  PRIMARY KEY (`Admin_ID`),
  FOREIGN KEY (`User_Id`) REFERENCES `Users`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 6) Medication & clinical documentation tables
--    (retained definitions; added charset/collation)
-- ================================================
CREATE TABLE IF NOT EXISTS `MEDICATION` (
  `Medication_ID`     INT           NOT NULL AUTO_INCREMENT,
  `Medication_Name`   VARCHAR(100)  NOT NULL,
  `Form`              VARCHAR(30)   NULL,
  `Strength`          VARCHAR(30)   NULL,
  CONSTRAINT `uk_med_name` UNIQUE (`Medication_Name`),
  PRIMARY KEY (`Medication_ID`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PRESCRIPTION` (
  `Prescription_ID`          INT      NOT NULL AUTO_INCREMENT,
  `Prescribing_Physician_ID` INT      NOT NULL,
  `Patient_ID`               INT      NOT NULL,
  `Issued_Date`              DATE     NOT NULL,
  `Notes`                    TEXT     NULL,
  PRIMARY KEY (`Prescription_ID`),
  CONSTRAINT `fk_presc_physician`
    FOREIGN KEY (`Prescribing_Physician_ID`)
    REFERENCES `PHYSICIAN`(`Physician_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT `fk_presc_patient`
    FOREIGN KEY (`Patient_ID`)
    REFERENCES `PATIENT`(`Patient_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PRESCRIPTION_MEDICATION` (
  `Prescription_ID` INT      NOT NULL,
  `Medication_ID`   INT      NOT NULL,
  `Dosage`          VARCHAR(50) NULL,
  `Frequency`       VARCHAR(50) NULL,
  `Refills`         INT         DEFAULT 0,
  PRIMARY KEY (`Prescription_ID`,`Medication_ID`),
  CONSTRAINT `fk_pm_prescription`
    FOREIGN KEY (`Prescription_ID`)
    REFERENCES `PRESCRIPTION`(`Prescription_ID`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_pm_medication`
    FOREIGN KEY (`Medication_ID`)
    REFERENCES `MEDICATION`(`Medication_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SOAP_ENTRIES` (
  `SOAP_ID`       INT      NOT NULL AUTO_INCREMENT,
  `Patient_ID`    INT      NOT NULL,
  `Physician_ID`  INT      NOT NULL,
  `Note_DateTime` DATETIME NOT NULL,
  `Subjective`    TEXT     NULL,
  `Objective`     TEXT     NULL,
  `Assessment`    TEXT     NULL,
  `Plan`          TEXT     NULL,
  PRIMARY KEY (`SOAP_ID`),
  CONSTRAINT `fk_soap_patient`
    FOREIGN KEY (`Patient_ID`)
    REFERENCES `PATIENT`(`Patient_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT `fk_soap_physician`
    FOREIGN KEY (`Physician_ID`)
    REFERENCES `PHYSICIAN`(`Physician_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX `idx_soap_patient_dt` (`Patient_ID`,`Note_DateTime`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ORDERS` (
  `Order_ID`              INT      NOT NULL AUTO_INCREMENT,
  `Ordering_Physician_ID` INT      NOT NULL,
  `Patient_ID`            INT      NULL,
  `Prescription_ID`       INT      NULL,
  `Order_Type`            VARCHAR(50) NOT NULL,
  `Order_Description`     TEXT     NULL,
  `Order_Status`          VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `Order_Date`            DATE     NOT NULL,
  `Completion_Date`       DATE     NULL,
  PRIMARY KEY (`Order_ID`),
  CONSTRAINT `fk_orders_physician`
    FOREIGN KEY (`Ordering_Physician_ID`)
    REFERENCES `PHYSICIAN`(`Physician_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_patient`
    FOREIGN KEY (`Patient_ID`)
    REFERENCES `PATIENT`(`Patient_ID`)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT `fk_orders_prescription`
    FOREIGN KEY (`Prescription_ID`)
    REFERENCES `PRESCRIPTION`(`Prescription_ID`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 7) Financial tables
-- ================================================
CREATE TABLE IF NOT EXISTS `BILLING` (
  `Bill_ID`                INT           NOT NULL AUTO_INCREMENT,
  `Patient_ID`             INT           NOT NULL,
  `Total_Charges`          DECIMAL(10,2) NOT NULL,
  `Patient_Responsibility` DECIMAL(10,2) NOT NULL,
  `Bill_Date`              DATE          NOT NULL,
  PRIMARY KEY (`Bill_ID`),
  CONSTRAINT `fk_billing_patient`
    FOREIGN KEY (`Patient_ID`)
    REFERENCES `PATIENT`(`Patient_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `INSURANCE` (
  `Insurance_ID`       INT           NOT NULL AUTO_INCREMENT,
  `Patient_ID`         INT           NOT NULL,
  `Insurance_Provider` VARCHAR(100)  NOT NULL,
  `Policy_Number`      VARCHAR(100)  NOT NULL,
  `Plan_Type`          VARCHAR(50)   NULL,
  `Effective_Date`     DATE          NOT NULL,
  `Expiration_Date`    DATE          NULL,
  `Copay`              DECIMAL(10,2) DEFAULT 0,
  `Deductible`         DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`Insurance_ID`),
  INDEX `idx_insurance_patient` (`Patient_ID`),
  CONSTRAINT `fk_insurance_patient`
    FOREIGN KEY (`Patient_ID`)
    REFERENCES `PATIENT`(`Patient_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `INSURANCE_CLAIM` (
  `Claim_ID`         INT           NOT NULL AUTO_INCREMENT,
  `Bill_ID`          INT           NOT NULL,
  `Insurance_ID`     INT           NOT NULL,
  `Claim_Date`       DATE          NOT NULL,
  `Claim_Status`     VARCHAR(50)   DEFAULT 'Submitted',
  `Amount_Claimed`   DECIMAL(10,2) NULL,
  `Amount_Approved`  DECIMAL(10,2) NULL,
  `Paid_To_Provider` DECIMAL(10,2) NULL,
  PRIMARY KEY (`Claim_ID`),
  CONSTRAINT `fk_claim_bill`
    FOREIGN KEY (`Bill_ID`)
    REFERENCES `BILLING`(`Bill_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT `fk_claim_insurance`
    FOREIGN KEY (`Insurance_ID`)
    REFERENCES `INSURANCE`(`Insurance_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
  
CREATE TABLE IF NOT EXISTS `PAYMENT` (
  `Payment_ID`     INT           NOT NULL AUTO_INCREMENT,
  `Bill_ID`        INT           NOT NULL,
  `Payment_Date`   DATE          NOT NULL,
  `Payment_Amount` DECIMAL(10,2) NOT NULL,
  `Payment_Method` VARCHAR(50)   NOT NULL,
  PRIMARY KEY (`Payment_ID`),
  CONSTRAINT `fk_payment_bill`
    FOREIGN KEY (`Bill_ID`)
    REFERENCES `BILLING`(`Bill_ID`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
=======
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

-- Merged `bed info` tables code
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
