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

export default router;