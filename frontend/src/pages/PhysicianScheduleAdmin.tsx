import React, { useEffect, useState } from 'react';
import api from '../api';

type Row = {
  Schedule_ID?: number;
  Physician_ID: number;
  Day_Of_Week: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  Start_Time: string;   // "09:00:00"
  End_Time:   string;
  Notes: string | null;
};

interface Physician {
  Physician_ID: number;
  Physician_Name: string;
}

export default function PhysicianScheduleAdmin() {
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [physId, setPhysId] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [edit, setEdit] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Fetch all physicians once
  useEffect(() => {
    const fetchPhysicians = async () => {
      try {
        const r = await api.get<Physician[]>('/admin/physicians');
        setPhysicians(r.data);
      } catch (e: any) {
        setErr(e.response?.data?.message || 'Failed to load physicians');
      }
    };
    fetchPhysicians();
  }, []);

  const load = async (id: string) => {
    if (!id) return setRows([]);
    try {
      const r = await api.get<Row[]>(`/admin/physician-schedule/${id}`);
      setRows(r.data);
      setErr(null);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Error');
    }
  };

  useEffect(() => {
    load(physId);
  }, [physId]);

  const save = async () => {
    const p = edit!;
    const body = { 
      Physician_ID: Number(p.Physician_ID), 
      Day_Of_Week: p.Day_Of_Week,
      Start_Time: p.Start_Time, 
      End_Time: p.End_Time, 
      Notes: p.Notes 
    };
    try {
      if (p.Schedule_ID) {
        await api.put(`/admin/physician-schedule/${p.Schedule_ID}`, body);
      } else {
        await api.post('/admin/physician-schedule', body);
      }
      setEdit(null);
      load(physId);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Save failed');
    }
  };

  const del = async (id: number) => {
    try {
      await api.delete(`/admin/physician-schedule/${id}`);
      load(physId);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="page">
      <h2>Physician Schedules</h2>
      <label>
        Physician:&nbsp;
        <select value={physId} onChange={e => setPhysId(e.target.value)}>
          <option value="">Select a physician</option>
          {physicians.map(physician => (
            <option key={physician.Physician_ID} value={physician.Physician_ID}>
              {physician.Physician_Name}
            </option>
          ))}
        </select>
      </label>

      {err && <p className="error">{err}</p>}

      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.Schedule_ID}>
              <td>{r.Day_Of_Week}</td>
              <td>{r.Start_Time}</td>
              <td>{r.End_Time}</td>
              <td>{r.Notes}</td>
              <td>
                <button onClick={() => setEdit(r)}>✎</button>
                <button onClick={() => del(r.Schedule_ID!)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button disabled={!physId}
        onClick={() => setEdit({
          Physician_ID: Number(physId),
          Day_Of_Week: 'Mon',
          Start_Time: '09:00',
          End_Time: '17:00',
          Notes: ''
        })}>
        + New Slot
      </button>

      {edit && (
        <Editor title={edit.Schedule_ID ? 'Edit Slot' : 'New Slot'}>
          <select value={edit.Day_Of_Week}
                  onChange={e => setEdit({ ...edit, Day_Of_Week: e.target.value as Row['Day_Of_Week'] })}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => 
              <option key={d} value={d}>{d}</option>
            )}
          </select>
          <input type="time" value={edit.Start_Time}
                 onChange={e => setEdit({ ...edit, Start_Time: e.target.value })} />
          <input type="time" value={edit.End_Time}
                 onChange={e => setEdit({ ...edit, End_Time: e.target.value })} />
          <input placeholder="Notes" value={edit.Notes || ''}
                 onChange={e => setEdit({ ...edit, Notes: e.target.value })} />
          <Actions onSave={save} onCancel={() => setEdit(null)} />
        </Editor>
      )}
    </div>
  );
}

const Editor: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) =>
  <div className="editor">
    <h4>{title}</h4>
    {children}
  </div>;

const Actions: React.FC<{ onSave(): void; onCancel(): void }> = ({ onSave, onCancel }) =>
  <p>
    <button onClick={onSave}>Save</button>
    <button onClick={onCancel}>Cancel</button>
  </p>;