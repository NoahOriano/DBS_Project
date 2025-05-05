import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticate, authorize, JwtPayload } from '../middleware/auth';

const router = Router();

// Middleware to ensure user is a physician
const physicianOnly = authorize(['physician']);

// 4.1 Bed Assignment
router.post('/bed/assign', authenticate, physicianOnly, async (req: Request, res: Response) => {
  const { bedId, patientId, assignedDate } = req.body;
  
  if (!bedId || !patientId || !assignedDate) {
    return res.status(400).json({ message: 'Bed ID, Patient ID, and Assigned Date are required' });
  }

  try {
    await pool.execute('CALL sp_assignBedToPatient(?, ?, ?)', [bedId, patientId, assignedDate]);
    res.json({ message: 'Bed assigned successfully' });
  } catch (error: any) {
    if (error.sqlMessage?.includes('already occupied')) {
      res.status(400).json({ message: 'Bed is already occupied' });
    } else {
      res.status(500).json({ message: 'Error assigning bed', error: error.message });
    }
  }
});

// 4.2 Discharge Patient
router.post('/patient/discharge', authenticate, physicianOnly, async (req: Request, res: Response) => {
  const { patientId, dischargeDate, summary } = req.body;
  const physicianUserId = (req.user as JwtPayload).id;

  if (!patientId || !dischargeDate || !summary) {
    return res.status(400).json({ message: 'Patient ID, Discharge Date, and Summary are required' });
  }

  try {
    // Get physician ID from user ID
    const [physicianRows]: any = await pool.execute(
      'SELECT Physician_ID FROM PHYSICIAN WHERE User_Id = ?',
      [physicianUserId]
    );
    
    if (!physicianRows[0]) {
      return res.status(404).json({ message: 'Physician profile not found' });
    }

    const physicianId = physicianRows[0].Physician_ID;

    await pool.execute('CALL sp_dischargePatient(?, ?, ?, ?)', 
      [patientId, physicianId, dischargeDate, summary]
    );
    
    res.json({ message: 'Patient discharged successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error discharging patient', error: error.message });
  }
});

// 4.3 SOAP Notes - Create
router.post('/soap', authenticate, physicianOnly, async (req: Request, res: Response) => {
  const { patientId, subjective, objective, assessment, plan } = req.body;
  const physicianUserId = (req.user as JwtPayload).id;

  if (!patientId || !subjective || !objective || !assessment || !plan) {
    return res.status(400).json({ message: 'All SOAP fields are required' });
  }

  try {
    // Get physician ID from user ID
    const [physicianRows]: any = await pool.execute(
      'SELECT Physician_ID FROM PHYSICIAN WHERE User_Id = ?',
      [physicianUserId]
    );
    
    if (!physicianRows[0]) {
      return res.status(404).json({ message: 'Physician profile not found' });
    }

    const physicianId = physicianRows[0].Physician_ID;
    const noteDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.execute('CALL sp_add_soap_entry(?, ?, ?, ?, ?, ?, ?)', 
      [patientId, physicianId, noteDateTime, subjective, objective, assessment, plan]
    );
    
    res.json({ message: 'SOAP note created successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating SOAP note', error: error.message });
  }
});

// 4.3 SOAP Notes - Get
router.get('/soap/:patientId', authenticate, physicianOnly, async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    let query;
    let params;

    if (startDate && endDate) {
      query = 'CALL sp_getSOAPEntries(?, ?, ?)';
      params = [patientId, startDate, endDate];
    } else {
      query = 'CALL sp_getLatestSOAPEntry(?)';
      params = [patientId];
    }

    const [rows]: any = await pool.execute(query, params);
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving SOAP notes', error: error.message });
  }
});

// 4.4 Lab Tests
router.post('/lab/order', authenticate, physicianOnly, async (req: Request, res: Response) => {
  const { patientId, testType, dateOrdered, urgency } = req.body;
  const physicianUserId = (req.user as JwtPayload).id;

  if (!patientId || !testType || !dateOrdered) {
    return res.status(400).json({ message: 'Patient ID, Test Type, and Date Ordered are required' });
  }

  try {
    // Get physician ID from user ID
    const [physicianRows]: any = await pool.execute(
      'SELECT Physician_ID FROM PHYSICIAN WHERE User_Id = ?',
      [physicianUserId]
    );
    
    if (!physicianRows[0]) {
      return res.status(404).json({ message: 'Physician profile not found' });
    }

    const physicianId = physicianRows[0].Physician_ID;

    const [result]: any = await pool.execute('CALL sp_addLabTestWithNotification(?, ?, ?, ?, ?)', 
      [patientId, physicianId, testType, dateOrdered, urgency || 'Routine']
    );
    
    res.json({ 
      message: 'Lab test ordered successfully',
      labTestId: result[0][0].New_LabTest_ID 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error ordering lab test', error: error.message });
  }
});

// 4.5 Prescribe Medication
router.post('/prescription', authenticate, physicianOnly, async (req: Request, res: Response) => {
  const { patientId, medicationName, dosage, frequency, refills, notes } = req.body;
  const physicianUserId = (req.user as JwtPayload).id;

  if (!patientId || !medicationName || !dosage || !frequency) {
    return res.status(400).json({ message: 'Patient ID, Medication Name, Dosage, and Frequency are required' });
  }

  try {
    // Get physician ID from user ID
    const [physicianRows]: any = await pool.execute(
      'SELECT Physician_ID FROM PHYSICIAN WHERE User_Id = ?',
      [physicianUserId]
    );
    
    if (!physicianRows[0]) {
      return res.status(404).json({ message: 'Physician profile not found' });
    }

    const physicianId = physicianRows[0].Physician_ID;

    const [result]: any = await pool.execute('CALL sp_prescribeMedication(?, ?, ?, ?, ?, ?, ?)', 
      [physicianId, patientId, medicationName, dosage, frequency, refills || 0, notes || '']
    );
    
    res.json({ 
      message: 'Prescription created successfully',
      prescriptionId: result[0][0].New_Prescription_ID 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating prescription', error: error.message });
  }
});

// Get available beds
router.get('/beds/available', authenticate, physicianOnly, async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute('CALL sp_getAvailableBeds()');
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving available beds', error: error.message });
  }
});

// Get physician's patients
router.get('/patients', authenticate, physicianOnly, async (req: Request, res: Response) => {
  const physicianUserId = (req.user as JwtPayload).id;

  try {
    // Get physician ID from user ID
    const [physicianRows]: any = await pool.execute(
      'SELECT Physician_ID FROM PHYSICIAN WHERE User_Id = ?',
      [physicianUserId]
    );
    
    if (!physicianRows[0]) {
      return res.status(404).json({ message: 'Physician profile not found' });
    }

    const physicianId = physicianRows[0].Physician_ID;

    const [rows]: any = await pool.execute('CALL sp_getPhysicianPatients(?)', [physicianId]);
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving patients', error: error.message });
  }
});

export default router;