import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticate, authorize, JwtPayload } from '../middleware/auth';

const router      = Router();
const patientOnly = authorize(['patient']);

/* ──────────────────────────────────────
   1. Physician list for the dropdown
─────────────────────────────────────── */
router.get('/physicians', authenticate, patientOnly, async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT Physician_ID AS id,
             CONCAT(First_Name, ' ', Last_Name) AS name
      FROM PHYSICIAN
      ORDER BY name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load physicians' });
  }
});
router.get('/physicians/:id', authenticate, patientOnly, async (req: Request, res: Response) => {
  try {
    const physicianId = req.params.id;
    const [rows]: any = await pool.execute(`
      SELECT Physician_ID AS id,
             CONCAT(First_Name, ' ', Last_Name) AS name
      FROM PHYSICIAN
      WHERE Physician_ID = ?
    `, [physicianId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Physician not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load physician' });
  }
});

/* ──────────────────────────────────────
   2. Appointment CRUD
─────────────────────────────────────── */

/* helper: map Users.Id → PATIENT.Patient_ID  */
async function getPatientIdByUserId(userId: number): Promise<number | null> {
  const [[row]]: any = await pool.execute(
    'SELECT Patient_ID FROM PATIENT WHERE User_Id = ?',
    [userId]
  );
  return row ? row.Patient_ID : null;
}

/* GET all appointments for current patient */
router.get('/appointments', authenticate, patientOnly, async (req, res) => {
  const userId = (req.user as JwtPayload).id;
  const pid    = await getPatientIdByUserId(userId);
  if (!pid) return res.status(400).json({ message: 'User has no patient profile.' });

  const [rows]: any = await pool.execute(
    'CALL spGetAppointmentsForPatient(?)',
    [pid]
  );
  res.json(rows[0]);
});

/* POST create appointment */
router.post('/appointments', authenticate, patientOnly, async (req, res) => {
  const userId = (req.user as JwtPayload).id;
  const { physicianId, date, time, reason } = req.body;

  const pid = await getPatientIdByUserId(userId);
  if (!pid) return res.status(400).json({ message: 'User has no patient profile.' });

  if (!physicianId || !date || !time)
    return res.status(400).json({ message: 'Physician, date, and time are required.' });

  const [rows]: any = await pool.execute(
    'CALL spCreateAppointment(?,?,?,?,?)',
    [pid, physicianId, date, time, reason ?? null]
  );
  res.status(201).json(rows[0][0]);
});

/* PUT update */
router.put('/appointments/:id', authenticate, patientOnly, async (req, res) => {
  const { id } = req.params;
  const { date, time, reason } = req.body;

  const [rows]: any = await pool.execute(
    'CALL spUpdateAppointment(?,?,?,?)',
    [id, date, time, reason ?? null]
  );
  res.json(rows[0][0]);
});

/* DELETE */
router.delete('/appointments/:id', authenticate, patientOnly, async (req, res) => {
  const { id } = req.params;
  await pool.execute('CALL spDeleteAppointment(?)', [id]);
  res.json({ message: 'Deleted' });
});

export default router;
