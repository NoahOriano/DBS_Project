import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticate, authorize, JwtPayload } from '../middleware/auth';

const router      = Router();
const patientOnly = authorize(['patient']);

/* ──────────────────────────────────────────────── */
/* helper: map Users.Id → PATIENT.Patient_ID       */
async function getPatientIdByUserId(userId: number): Promise<number | null> {
  const [[row]]: any = await pool.execute(
    'SELECT Patient_ID FROM PATIENT WHERE User_Id = ?',
    [userId]
  );
  return row ? row.Patient_ID : null;
}

/* helper: return n if it’s a positive int, else null      */
function safeInt(val: any): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}
/* ──────────────────────────────────────────────── */

/* -------- 1. Physician dropdown ---------------- */
router.get('/physicians', authenticate, patientOnly, async (_req, res) => {
  const [rows]: any = await pool.execute(`
    SELECT ph.Physician_ID AS id,
           u.Username      AS username
      FROM PHYSICIAN ph
      JOIN Users u ON u.Id = ph.User_Id
     ORDER BY u.Username
  `);
  res.json(rows);
});

/* -------- 2. GET all appointments -------------- */
router.get('/appointments', authenticate, patientOnly, async (req, res) => {
  const pid = await getPatientIdByUserId((req.user as JwtPayload).id);
  if (!pid) return res.status(400).json({ message: 'User has no patient profile.' });

  const [rows]: any = await pool.execute('CALL spGetAppointmentsForPatient(?)', [pid]);
  res.json(rows[0]);
});

/* -------- 3. POST create ----------------------- */
router.post('/appointments', authenticate, patientOnly, async (req, res) => {
  const { physicianId, date, time, reason } = req.body;
  const pid = await getPatientIdByUserId((req.user as JwtPayload).id);

  if (!pid) return res.status(400).json({ message: 'User has no patient profile.' });
  if (!physicianId || !date || !time)
    return res.status(400).json({ message: 'Physician, date, and time are required.' });

  const [rows]: any = await pool.execute(
    'CALL spCreateAppointment(?,?,?,?,?)',
    [pid, physicianId, date, time, reason ?? null]
  );
  res.status(201).json(rows[0][0]);
});

/* -------- 4. PUT update ------------------------ */
router.put('/appointments/:id', authenticate, patientOnly, async (req, res) => {
  const appId = safeInt(req.params.id);
  if (!appId) return res.status(400).json({ message: 'Invalid appointment ID.' });

  const { date, time, reason } = req.body;

  const [rows]: any = await pool.execute(
    'CALL spUpdateAppointment(?,?,?,?)',
    [appId, date, time, reason ?? null]
  );
  res.json(rows[0][0]);
});

/* -------- 5. DELETE ---------------------------- */
router.delete('/appointments/:id', authenticate, patientOnly, async (req, res) => {
  const appId = safeInt(req.params.id);
  if (!appId) return res.status(400).json({ message: 'Invalid appointment ID.' });

  await pool.execute('CALL spDeleteAppointment(?)', [appId]);
  res.json({ message: 'Deleted' });
});

export default router;
