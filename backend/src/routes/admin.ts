// src/routes/admin.ts -------------------------------------------------
import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// shortcut – all endpoints require an *admin* JWT
router.use(authenticate);

router.get('/physicians', async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      "SELECT Physician_ID, CONCAT(First_Name, ' ', Last_Name) AS Physician_Name FROM PHYSICIAN"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load physicians' });
  }
});

router.get('/patients', async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT Patient_ID AS id,
             First_Name,
             Last_Name,
             CONCAT(First_Name, ' ', Last_Name) AS name
      FROM PATIENT
      ORDER BY Last_Name, First_Name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load patients' });
  }
});

router.get('/physician-schedule/:physicianId', async (req, res) => {
  const [rows]: any = await pool.execute(
    'SELECT * FROM PHYSICIAN_SCHEDULE WHERE Physician_ID = ?',
    [req.params.physicianId]
  );
  res.json(rows);
});

router.post('/physician-schedule', async (req, res) => {
  const s = req.body;
  await pool.execute(
    'CALL spUpsertPhysicianSchedule(?,?,?,?,?,?)',
    [null, s.Physician_ID, s.Day_Of_Week, s.Start_Time, s.End_Time, s.Notes]
  );
  res.json({ message: 'Schedule entry created' });
});

router.put('/physician-schedule/:id', async (req, res) => {
  const s = req.body;
  await pool.execute(
    'CALL spUpsertPhysicianSchedule(?,?,?,?,?,?)',
    [req.params.id, s.Physician_ID, s.Day_Of_Week, s.Start_Time, s.End_Time, s.Notes]
  );
  res.json({ message: 'Schedule entry updated' });
});

router.delete('/physician-schedule/:id', async (req, res) => {
  await pool.execute('CALL spDeletePhysicianSchedule(?)', [req.params.id]);
  res.json({ message: 'Schedule entry deleted' });
});

/* ====== 2.2  Bed admin ====== */
router.get('/beds', async (_req, res) => {
  const [rows]: any = await pool.execute('SELECT * FROM BED');
  res.json(rows);
});

router.post('/beds', async (req, res) => {
  const b = req.body;
  await pool.execute('CALL spUpsertBed(?,?,?,?)',
    [null, b.Bed_Number, b.Ward, b.Status]);
  res.json({ message: 'Bed created' });
});

router.put('/beds/:id', async (req, res) => {
  const b = req.body;
  await pool.execute('CALL spUpsertBed(?,?,?,?)',
    [req.params.id, b.Bed_Number, b.Ward, b.Status]);
  res.json({ message: 'Bed updated' });
});

router.delete('/beds/:id', async (req, res) => {
  await pool.execute('CALL spDeleteBed(?)', [req.params.id]);
  res.json({ message: 'Bed deleted' });
});

/* ====== 2.3  Bed Rates ====== */
router.get('/bed-rates', async (_req, res) => {
  const [rows]: any = await pool.execute('SELECT * FROM BED_RATE');
  res.json(rows);
});

router.post('/bed-rates', async (req, res) => {
  const r = req.body;
  await pool.execute('CALL spUpsertBedRate(?,?,?,?,?)',
    [null, r.Ward, r.Daily_Rate, r.Effective_From, r.Effective_To]);
  res.json({ message: 'Rate created' });
});

router.put('/bed-rates/:id', async (req, res) => {
  const r = req.body;
  await pool.execute('CALL spUpsertBedRate(?,?,?,?,?)',
    [req.params.id, r.Ward, r.Daily_Rate, r.Effective_From, r.Effective_To]);
  res.json({ message: 'Rate updated' });
});

router.delete('/bed-rates/:id', async (req, res) => {
  await pool.execute('CALL spDeleteBedRate(?)', [req.params.id]);
  res.json({ message: 'Rate deleted' });
});

// GET all billing records
router.get('/invoice', async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT Bill_ID, Patient_ID, Bill_Date, Total_Charges, Patient_Responsibility FROM BILLING`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load billing records' });
  }
});

// GET a specific billing record by Bill_ID using a stored procedure
router.get('/invoice/:billId', async (req: Request, res: Response) => {
  const { billId } = req.params;
  try {
    const [result]: any = await pool.execute('CALL spGenerateBilling(?)', [billId]);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate billing record' });
  }
});

// POST – Create a new billing record (invoice)
router.post('/invoice', async (req: Request, res: Response) => {
  const inv = req.body;  
  try {
    await pool.execute(
      'CALL spUpsertBilling(?,?,?,?,?)',
      [
        null,                       // Bill_ID null for new invoice
        inv.Patient,                // Patient (ID or name, adjust as needed)
        inv.Bill_Date,              // Bill_Date (yyyy-mm-dd)
        inv.Total_Charges,          // Total_Charges
        inv.Patient_Responsibility, // Patient_Responsibility
      ]
    );
    res.status(201).json({ message: 'Billing record created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create billing record' });
  }
});

// PUT – Update an existing billing record (invoice)
router.put('/invoice/:billId', async (req: Request, res: Response) => {
  const { billId } = req.params;
  const inv = req.body;
  try {
    await pool.execute(
      'CALL spUpsertBilling(?,?,?,?,?)',
      [
        billId,                     // Existing Bill_ID to update
        inv.Patient,                // Patient (ID or name)
        inv.Bill_Date,              // Bill_Date
        inv.Total_Charges,          // Total_Charges
        inv.Patient_Responsibility, // Patient_Responsibility
      ]
    );
    res.json({ message: 'Billing record updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update billing record' });
  }
});

export default router;