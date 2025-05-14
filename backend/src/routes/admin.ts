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

router.get('/invoice/:billId', async (req, res) => {
  const { billId } = req.params;
  try {
      const [result]: any = await pool.execute('CALL spGenerateInvoice(?)', [billId]);
      res.json(result);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to generate invoice' });
  }
});

router.post('/billings', async (req: Request, res: Response) => {
  const { patientId, totalCharges, patientResponsibility, billDate } = req.body;

  if (patientId === undefined || totalCharges === undefined || patientResponsibility === undefined || !billDate) {
    return res.status(400).json({ message: 'Patient ID, total charges, patient responsibility, and bill date are required.' });
  }

  // Basic validation for numeric types
  if (isNaN(parseFloat(totalCharges)) || isNaN(parseFloat(patientResponsibility)) || isNaN(parseInt(patientId))) {
      return res.status(400).json({ message: 'Patient ID, total charges, and patient responsibility must be valid numbers.' });
  }
   // Validate date format if necessary, though HTML5 date input should provide YYYY-MM-DD
  
  try {
    // sp_generate_bill (IN p_patient_id INT, IN p_total_charges DECIMAL(10,2), IN p_patient_resp DECIMAL(10,2), IN p_bill_date DATE)
    // It has a `SELECT LAST_INSERT_ID() AS New_Bill_ID;`
    const [result]: any = await pool.execute(
      'CALL sp_generate_bill(?, ?, ?, ?)',
      [parseInt(patientId), parseFloat(totalCharges), parseFloat(patientResponsibility), billDate]
    );
    
    const newBillId = result[0]?.[0]?.New_Bill_ID;

    if (newBillId) {
      res.status(201).json({ message: 'Invoice created successfully', billId: newBillId });
    } else {
      // Fallback or error if New_Bill_ID is not returned as expected
      // This might happen if the procedure output changes or if there's an issue with how results are wrapped.
      console.error('Unexpected result from sp_generate_bill, New_Bill_ID not found:', result);
      // Check if it's an OkPacket from a direct INSERT/UPDATE in the procedure (though sp_generate_bill has a SELECT)
      if (Array.isArray(result) && result.length > 0 && typeof result[0].insertId === 'number' && result[0].insertId > 0) {
         res.status(201).json({ message: 'Invoice created successfully (using insertId)', billId: result[0].insertId });
      } else {
        res.status(500).json({ message: 'Failed to create invoice or retrieve new Bill ID.' });
      }
    }
  } catch (err: any) {
    console.error('Error creating invoice:', err);
    // Check for specific SQL errors if needed, e.g., foreign key constraint
    if (err.sqlMessage) {
        return res.status(400).json({ message: `Database error: ${err.sqlMessage}` });
    }
    res.status(500).json({ message: err.message || 'Failed to create invoice due to a server error.' });
  }
});


export default router;