import { Router, Request, Response } from 'express';
import pool from '../db';
import { authenticate, JwtPayload } from '../middleware/auth';

const router = Router();

// helper: undefined → null
function nullify<T>(v: T | undefined): T | null {
  return v === undefined ? null : v;
}

// GET /api/profile
router.get('/', authenticate, async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).id;
  const roles  = (req.user as JwtPayload).roles;

  // 1) fetch basic user info
  const [userRows]: any = await pool.execute(
    'CALL spGetUserById(?)',
    [userId]
  );
  const user = userRows[0]?.[0];
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // 2) fetch role-specific profile
  let profileRec: Record<string, any> = {};
  if (roles.includes('patient')) {
    const [rows]: any = await pool.execute('CALL spGetPatientProfile(?)', [userId]);
    profileRec = rows[0]?.[0] || {};
  } else if (roles.includes('physician')) {
    const [rows]: any = await pool.execute('CALL spGetPhysicianProfile(?)', [userId]);
    profileRec = rows[0]?.[0] || {};
  } else /* admin */ {
    const [rows]: any = await pool.execute('CALL spGetAdminProfile(?)', [userId]);
    profileRec = rows[0]?.[0] || {};
  }

  // 3) merge & send
  res.json({
    id:       user.Id,
    username: user.Username,
    roles:    (user.Roles as string).split(','),
    ...profileRec
  });
});

// PUT /api/profile
router.put('/', authenticate, async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).id;
  const roles  = (req.user as JwtPayload).roles;
  const b      = req.body;

  if (roles.includes('patient')) {
    await pool.execute(
      'CALL spUpdatePatientProfile(?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        userId,
        nullify(b.Medical_Record_Number),
        nullify(b.Gender),
        nullify(b.Contact_Phone),
        nullify(b.Contact_Email),
        nullify(b.Home_Address),
        nullify(b.Primary_Care_Physician),
        nullify(b.Insurance_Provider),
        nullify(b.Insurance_Policy_Number),
        nullify(b.Emergency_Contact_Name),
        nullify(b.Emergency_Contact_Rel),
        nullify(b.Known_Allergies),
      ]
    );

  } else if (roles.includes('physician')) {
    await pool.execute(
      'CALL spUpdatePhysicianProfile(?,?,?,?,?,?,?,?,?,?,?)',
      [
        userId,
        nullify(b.Medical_License_Number),
        nullify(b.Specialty),
        nullify(b.Department),
        nullify(b.Office_Location),
        nullify(b.Contact_Phone),
        nullify(b.Contact_Email),
        nullify(b.Office_Hours),
        nullify(b.Board_Certifications),
        nullify(b.Education),
        nullify(b.Professional_Bio),
      ]
    );

  } else { // admin
    await pool.execute(
      'CALL spUpdateAdminProfile(?,?,?,?,?,?,?,?,?,?,?)',
      [
        userId,
        nullify(b.Employee_ID),
        nullify(b.Department),
        nullify(b.Job_Title),
        nullify(b.Contact_Phone),
        nullify(b.Contact_Email),
        nullify(b.Office_Location),
        nullify(b.Permission_Level),
        nullify(b.Work_Schedule),
        nullify(b.Responsibilities),
        nullify(b.Emergency_Contact),
      ]
    );
  }

  res.json({ message: 'Profile updated' });
});

export default router;
