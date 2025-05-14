// backend/src/routes/patient.ts
import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticate, JwtPayload } from '../middleware/auth';

const router = Router();
router.use(authenticate); // All patient routes require authentication

// GET /api/patient/bills
router.get('/bills', async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).id;
  try {
    const [rows]: any = await pool.execute('CALL spGetPatientBillsWithBalance(?)', [userId]);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching patient bills:', error);
    res.status(500).json({ message: 'Failed to fetch bills', error: error.message });
  }
});

// POST /api/patient/payments
router.post('/payments', async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).id; // For potential validation against bill ownership
  const { billId, amount, method } = req.body;

  if (!billId || amount === undefined || !method) {
    return res.status(400).json({ message: 'Bill ID, amount, and payment method are required.' });
  }
  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount.' });
  }

  try {
    // Additional validation could be added here to ensure the bill belongs to the user
    // For example, fetch patient_id for the user, then check if the billId is for that patient_id.
    const paymentDate = new Date().toISOString().split('T')[0];

    await pool.execute('CALL sp_record_payment(?, ?, ?, ?)', [billId, paymentDate, paymentAmount, method]);
    res.status(200).json({ message: 'Payment recorded successfully' });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
});

export default router;