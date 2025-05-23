import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

type ProfileData = Record<string, any>;

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form,    setForm]    = useState<ProfileData>({});
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // 1) Fetch
  useEffect(() => {
    api.get<ProfileData>('/profile')
      .then(res => {
        setProfile(res.data);
        setForm(res.data);
      })
      .catch(() => {
        logout();
        navigate('/login');
      });
  }, [logout, navigate]);

  if (!profile) return <div>Loading…</div>;
  const role = profile.roles?.[0] as string;

  // 2) Field definitions
  type Field = { key: string; label: string; type?: string; options?: string[] };

  let fields: Field[] = [];
  if (role === 'patient') {
    fields = [
      { key: 'First_Name',             label: 'First Name' },
      { key: 'Last_Name',              label: 'Last Name' },
      { key: 'Date_Of_Birth',          label: 'Date of Birth', type: 'date' },
      { key: 'Medical_Record_Number',  label: 'Medical Record #' },
      { key: 'Gender',                 label: 'Gender', options: ['Male','Female','Other'] },
      { key: 'Contact_Phone',          label: 'Phone' },
      { key: 'Contact_Email',          label: 'Email' },
      { key: 'Home_Address',           label: 'Address' },
      { key: 'Primary_Care_Physician', label: 'Primary Care Physician' },
      { key: 'Insurance_Provider',     label: 'Insurance Provider' },
      { key: 'Insurance_Policy_Number',label: 'Policy Number' },
      { key: 'Emergency_Contact_Name', label: 'Emergency Contact Name' },
      { key: 'Emergency_Contact_Rel',  label: 'Emergency Contact Relation' },
      { key: 'Known_Allergies',        label: 'Known Allergies' },
    ];
  } else if (role === 'physician') {
    fields = [
      { key: 'First_Name',             label: 'First Name' },
      { key: 'Last_Name',              label: 'Last Name' },
      { key: 'Role',                   label: 'Role (e.g. Cardiologist)' },
      { key: 'Medical_License_Number', label: 'License #' },
      { key: 'Specialty',              label: 'Specialty' },
      { key: 'Department',             label: 'Department' },
      { key: 'Office_Location',        label: 'Office Location' },
      { key: 'Contact_Phone',          label: 'Phone' },
      { key: 'Contact_Email',          label: 'Email' },
      { key: 'Office_Hours',           label: 'Office Hours' },
      { key: 'Board_Certifications',   label: 'Board Certifications' },
      { key: 'Education',              label: 'Education' },
      { key: 'Professional_Bio',       label: 'Professional Bio' },
    ];
  } else /* admin */ {
    fields = [
      { key: 'First_Name',      label: 'First Name' },
      { key: 'Last_Name',       label: 'Last Name' },
      { key: 'Employee_ID',     label: 'Employee ID' },
      { key: 'Department',      label: 'Department' },
      { key: 'Job_Title',       label: 'Job Title' },
      { key: 'Contact_Phone',   label: 'Phone' },
      { key: 'Contact_Email',   label: 'Email' },
      { key: 'Office_Location', label: 'Office Location' },
      { key: 'Permission_Level',label: 'Permission Level' },
      { key: 'Work_Schedule',   label: 'Work Schedule' },
      { key: 'Responsibilities',label: 'Responsibilities' },
      { key: 'Emergency_Contact',label: 'Emergency Contact' },
    ];
  }

  // 3) Handlers
  const handleChange = (key: string) => 
    (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
    };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.put('/profile', form);
      setProfile(form);
      setEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // 4) Render
  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>My Profile</h2>
      <p><strong>Username:</strong> {profile.username}</p>
      <p><strong>Role:</strong> {role}</p>
      <hr />

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {editing ? (
        <>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: '1rem' }}>
              <label>{f.label}</label><br />
              {f.options ? (
                <select
                  value={form[f.key] || ''}
                  onChange={handleChange(f.key)}
                  style={{ width: '100%' }}
                >
                  <option value="">— Select —</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={form[f.key] || ''}
                  onChange={handleChange(f.key)}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          ))}

          <button onClick={save} disabled={saving} style={{ marginRight: 8 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => { setEditing(false); setForm(profile); }}>
            Cancel
          </button>
        </>
      ) : (
        <>
          {fields.map(f => (
            <p key={f.key}>
              <strong>{f.label}:</strong> {profile[f.key] ?? '—'}
            </p>
          ))}
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </>
      )}
    </div>
  );
}
