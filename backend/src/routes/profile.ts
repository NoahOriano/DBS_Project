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

  try {
    // 1) basic user
    const [uRows]: any = await pool.execute('CALL spGetUserById(?)', [userId]);
    const user = uRows[0]?.[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2) role‐specific - using User_Id instead of userId
    let profileRec: Record<string, any> = {};
    if (roles.includes('patient')) {
      const [pRows]: any = await pool.execute('CALL spGetPatientProfile(?)', [userId]);
      profileRec = pRows[0]?.[0] || {};
    } else if (roles.includes('physician')) {
      const [dRows]: any = await pool.execute('CALL spGetPhysicianProfile(?)', [userId]);
      profileRec = dRows[0]?.[0] || {};
    } else {
      const [aRows]: any = await pool.execute('CALL spGetAdminProfile(?)', [userId]);
      profileRec = aRows[0]?.[0] || {};
    }

    // 3) merge & return
    res.json({
      id:       user.Id,
      username: user.Username,
      roles:    (user.Roles as string).split(','),
      ...profileRec
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PUT /api/profile
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as JwtPayload).id;
    const roles  = (req.user as JwtPayload).roles;
    const b      = req.body as any;

    if (roles.includes('patient')) {
      const {
        First_Name,
        Last_Name,
        Date_Of_Birth,            // incoming ISO string
        Medical_Record_Number,
        Gender,
        Contact_Phone,
        Contact_Email,
        Home_Address,
        Primary_Care_Physician,
        Insurance_Provider,
        Insurance_Policy_Number,
        Emergency_Contact_Name,
        Emergency_Contact_Rel,
        Known_Allergies,
      } = b;

      // convert ISO datetime → YYYY-MM-DD or null
      const dobFormatted = Date_Of_Birth
        ? new Date(Date_Of_Birth).toISOString().slice(0, 10)
        : null;

      // now 15 placeholders: userId + 14 fields
      await pool.execute(
        'CALL spUpdatePatientProfile(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          userId,
          nullify(First_Name),
          nullify(Last_Name),
          nullify(dobFormatted),
          nullify(Medical_Record_Number),
          nullify(Gender),
          nullify(Contact_Phone),
          nullify(Contact_Email),
          nullify(Home_Address),
          nullify(Primary_Care_Physician),
          nullify(Insurance_Provider),
          nullify(Insurance_Policy_Number),
          nullify(Emergency_Contact_Name),
          nullify(Emergency_Contact_Rel),
          nullify(Known_Allergies),
        ]
      );

    } else if (roles.includes('physician')) {
      const {
        First_Name,
        Last_Name,
        Role,
        Medical_License_Number,
        Specialty,
        Department,
        Office_Location,
        Contact_Phone,
        Contact_Email,
        Office_Hours,
        Board_Certifications,
        Education,
        Professional_Bio,
      } = b;

      // now 14 placeholders: userId + 13 fields
      await pool.execute(
        'CALL spUpdatePhysicianProfile(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          userId,
          nullify(First_Name),
          nullify(Last_Name),
          nullify(Role),
          nullify(Medical_License_Number),
          nullify(Specialty),
          nullify(Department),
          nullify(Office_Location),
          nullify(Contact_Phone),
          nullify(Contact_Email),
          nullify(Office_Hours),
          nullify(Board_Certifications),
          nullify(Education),
          nullify(Professional_Bio),
        ]
      );

    } else { // admin
      const {
        First_Name,
        Last_Name,
        Employee_ID,
        Department,
        Job_Title,
        Contact_Phone,
        Contact_Email,
        Office_Location,
        Permission_Level,
        Work_Schedule,
        Responsibilities,
        Emergency_Contact,
      } = b;

      // 13 placeholders: userId + 12 fields
      await pool.execute(
        'CALL spUpdateAdminProfile(?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          userId,
          nullify(First_Name),
          nullify(Last_Name),
          nullify(Employee_ID),
          nullify(Department),
          nullify(Job_Title),
          nullify(Contact_Phone),
          nullify(Contact_Email),
          nullify(Office_Location),
          nullify(Permission_Level),
          nullify(Work_Schedule),
          nullify(Responsibilities),
          nullify(Emergency_Contact),
        ]
      );
    }

    res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;