import React, { useEffect, useState } from 'react';
import api from '../api';

type Bed = {
  Bed_ID?: number;
  Bed_Number: string;
  Ward: string;
  Status: 'Available' | 'Occupied';
};

export default function BedAdmin() {
  const [rows, setRows]   = useState<Bed[]>([]);
  const [edit, setEdit]   = useState<Bed | null>(null);
  const [err,  setErr]    = useState<string | null>(null);

  /* fetch all beds once */
  useEffect(() => { api.get<Bed[]>('/admin/beds').then(r => setRows(r.data)); }, []);

  const save = async () => {
    try {
      edit?.Bed_ID
        ? await api.put(`/admin/beds/${edit.Bed_ID}`, edit)
        : await api.post('/admin/beds', edit);
      setEdit(null);
      setRows((await api.get<Bed[]>('/admin/beds')).data);
    } catch (e: any) { setErr(e.response?.data?.message || 'Error'); }
  };

  const del = async (id: number) => {
    await api.delete(`/admin/beds/${id}`);
    setRows(rows.filter(r => r.Bed_ID !== id));
  };

  return (
    <div className="page">
      <h2>Bed Administration</h2>
      {err && <p className="error">{err}</p>}

      <table>
        <thead><tr><th>#</th><th>Ward</th><th>Status</th><th /></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.Bed_ID}>
              <td>{r.Bed_Number}</td><td>{r.Ward}</td><td>{r.Status}</td>
              <td>
                <button onClick={() => setEdit(r)}>✎</button>
                <button onClick={() => del(r.Bed_ID!)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setEdit({ Bed_Number: '', Ward: '', Status: 'Available' })}>
        + New Bed
      </button>

      {edit && (
        <Editor title={edit.Bed_ID ? 'Edit Bed' : 'New Bed'}>
          <input placeholder="Number" value={edit.Bed_Number}
                 onChange={e => setEdit({ ...edit, Bed_Number: e.target.value })} />
          <input placeholder="Ward" value={edit.Ward}
                 onChange={e => setEdit({ ...edit, Ward: e.target.value })} />
          <select value={edit.Status}
                  onChange={e => setEdit({ ...edit, Status: e.target.value as any })}>
            <option>Available</option><option>Occupied</option>
          </select>
          <Actions onSave={save} onCancel={() => setEdit(null)} />
        </Editor>
      )}
    </div>
  );
}

/* small helpers to keep markup tidy */
const Editor: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="editor"><h4>{title}</h4>{children}</div>
);
const Actions: React.FC<{ onSave(): void; onCancel(): void }> = ({ onSave, onCancel }) => (
  <p><button onClick={onSave}>Save</button><button onClick={onCancel}>Cancel</button></p>
);