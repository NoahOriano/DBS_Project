CREATE TABLE dbo.Users (
  Id INT IDENTITY PRIMARY KEY,
  Username NVARCHAR(100) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(200) NOT NULL,
  Roles NVARCHAR(200) NOT NULL DEFAULT 'user'
);

CREATE TABLE dbo.Items (
  Id INT IDENTITY PRIMARY KEY,
  UserId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  Name NVARCHAR(100) NOT NULL
);

-----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping One
-----------------------------------------------------------------------------------------------------------------------------------------------------------------


-----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping Two - Noah Oriano - Schema
-----------------------------------------------------------------------------------------------------------------------------------------------------------------

/* PATIENT — Master record for every person receiving care */
CREATE TABLE PATIENT (
    Patient_ID      INT          NOT NULL AUTO_INCREMENT,
    First_Name      VARCHAR(50)  NOT NULL,
    Last_Name       VARCHAR(50)  NOT NULL,
    Date_Of_Birth   DATE,
    PRIMARY KEY (Patient_ID)
) ENGINE = InnoDB;

/* PHYSICIAN — Licensed provider (may include residents, etc.) */
CREATE TABLE PHYSICIAN (
    Physician_ID    INT          NOT NULL AUTO_INCREMENT,
    First_Name      VARCHAR(50)  NOT NULL,
    Last_Name       VARCHAR(50)  NOT NULL,
    Role            VARCHAR(50),            -- e.g., 'Cardiologist'
    PRIMARY KEY (Physician_ID)
) ENGINE = InnoDB;

/* MEDICATION — Central drug catalogue (one row per drug/strength) */
CREATE TABLE MEDICATION (
    Medication_ID     INT           NOT NULL AUTO_INCREMENT,
    Medication_Name   VARCHAR(100)  NOT NULL,
    Form              VARCHAR(30),             -- tablet, syrup, …
    Strength          VARCHAR(30),             -- 500 mg, 10 mL, …
    CONSTRAINT uk_med_name UNIQUE (Medication_Name),
    PRIMARY KEY (Medication_ID)
) ENGINE = InnoDB;

/*-------------------------------------------------------------
  2.  CLINICAL DOCUMENTATION
-------------------------------------------------------------*/

/* PRESCRIPTION — Header (one per prescribing event) */
CREATE TABLE PRESCRIPTION (
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
) ENGINE = InnoDB;

/* PRESCRIPTION_MEDICATION — M:N detail lines for each drug */
CREATE TABLE PRESCRIPTION_MEDICATION (
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
) ENGINE = InnoDB;

/* SOAP_ENTRIES — Subjective-Objective-Assessment-Plan notes */
CREATE TABLE SOAP_ENTRIES (
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
        FOREIGN KEY (Patient_ID)   REFERENCES PATIENT   (Patient_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_soap_physician
        FOREIGN KEY (Physician_ID) REFERENCES PHYSICIAN (Physician_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_soap_patient_dt (Patient_ID, Note_DateTime)
) ENGINE = InnoDB;

/* ORDERS — Lab / imaging / procedure orders */
CREATE TABLE ORDERS (
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
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_orders_patient
        FOREIGN KEY (Patient_ID)
        REFERENCES PATIENT (Patient_ID)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_orders_prescription
        FOREIGN KEY (Prescription_ID)
        REFERENCES PRESCRIPTION (Prescription_ID)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB;

/*-------------------------------------------------------------
  3.  FINANCIAL TABLES
-------------------------------------------------------------*/

/* BILLING — Charge document (one per care episode or cycle) */
CREATE TABLE BILLING (
    Bill_ID                 INT           NOT NULL AUTO_INCREMENT,
    Patient_ID              INT           NOT NULL,
    Total_Charges           DECIMAL(10,2) NOT NULL,
    Patient_Responsibility  DECIMAL(10,2) NOT NULL,
    Bill_Date               DATE          NOT NULL,
    PRIMARY KEY (Bill_ID),
    CONSTRAINT fk_billing_patient
        FOREIGN KEY (Patient_ID)
        REFERENCES PATIENT (Patient_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

/* INSURANCE — Patient policy record (one row per policy) */
CREATE TABLE INSURANCE (
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
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

/* INSURANCE_CLAIM — Submission to insurer against a bill */
CREATE TABLE INSURANCE_CLAIM (
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
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_claim_insurance
        FOREIGN KEY (Insurance_ID)
        REFERENCES INSURANCE (Insurance_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

/* PAYMENT — Cash / card / ACH settlements made by patient */
CREATE TABLE PAYMENT (
    Payment_ID      INT           NOT NULL AUTO_INCREMENT,
    Bill_ID         INT           NOT NULL,
    Payment_Date    DATE          NOT NULL,
    Payment_Amount  DECIMAL(10,2) NOT NULL,
    Payment_Method  VARCHAR(50)   NOT NULL,  -- 'Card', 'Cash', 'Check', …
    PRIMARY KEY (Payment_ID),
    CONSTRAINT fk_payment_bill
        FOREIGN KEY (Bill_ID)
        REFERENCES BILLING (Bill_ID)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

-----------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Grouping Three
-----------------------------------------------------------------------------------------------------------------------------------------------------------------