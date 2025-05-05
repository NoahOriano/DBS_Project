// src/pages/PatientAppointments.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import api from '../api';

interface Appointment {
  id:                 number;
  physicianId:        number;
  physicianUsername?: string;     // returned by backend
  date:               string;     // yyyy‑mm‑dd
  time:               string;     // HH:MM
  reason:             string;
}

export default function PatientAppointments() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [physicians,   setPhysicians]   = useState<{ id: number; username: string }[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Appointment, 'id' | 'physicianUsername'>>({
    physicianId: 0,
    date: '',
    time: '',
    reason: '',
  });

  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  /* ─────────────────────────────────────────────
     1. Load physicians (once) and appointments
  ───────────────────────────────────────────── */
  useEffect(() => {
    async function loadAll() {
      try {
        const [{ data: phys }, { data: appts }] = await Promise.all([
          api.get<{ id: number; username: string }[]>('/patient/physicians'),
          api.get<Appointment[]>('/patient/appointments'),
        ]);
        setPhysicians(phys);
        setAppointments(appts);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [logout, navigate]);

  /* ─────────────────────────────────────────────
     2. Helpers
  ───────────────────────────────────────────── */
  const startNew = () => {
    setEditingId(null);
    setForm({ physicianId: 0, date: '', time: '', reason: '' });
    setError(null);
  };

  const startEdit = (appt: Appointment) => {
    setEditingId(appt.id);
    setForm({
      physicianId: appt.physicianId,
      date:        appt.date,
      time:        appt.time,
      reason:      appt.reason,
    });
    setError(null);
  };

  const handleChange =
    <K extends keyof typeof form>(
      key: K,
    ): React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> =>
    (e) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  /* ─────────────────────────────────────────────
     3. Submit (create / update)
  ───────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // convert physicianId to number (select gives string)
    const payload = { ...form, physicianId: Number(form.physicianId) };

    try {
      if (editingId == null) {
        const { data: newAppt } = await api.post<Appointment>(
          '/patient/appointments',
          payload,
        );
        setAppointments((a) => [...a, newAppt]);
      } else {
        const { data: updated } = await api.put<Appointment>(
          `/patient/appointments/${editingId}`,
          payload,
        );
        setAppointments((a) =>
          a.map((x) => (x.id === editingId ? updated : x)),
        );
      }
      startNew();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────────────────────────
     4. Delete
  ───────────────────────────────────────────── */
  const handleDelete = async (id: number) => {
    if (!window.confirm('Really delete this appointment?')) return;
    try {
      await api.delete(`/patient/appointments/${id}`);
      setAppointments((a) => a.filter((x) => x.id !== id));
    } catch {
      /* ignore for now */
    }
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  if (loading) return <div>Loading appointments…</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>My Appointments</h2>

      {/* LIST */}
      <div style={{ marginBottom: '2rem' }}>
        {appointments.length === 0 ? (
          <p>No appointments yet.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {appointments.map((a) => (
              <li
                key={a.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>
                    {a.date} @ {a.time}
                  </strong>
                  <br />
                  <small>
                    Dr&nbsp;
                    {a.physicianUsername ??
                      physicians.find((p) => p.id === a.physicianId)?.username ??
                      '(unknown)'}
                  </small>
                  <br />
                  <small>{a.reason}</small>
                </div>
                <div>
                  <button onClick={() => startEdit(a)} style={{ marginRight: 8 }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(a.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button onClick={startNew}>+ New Appointment</button>
      </div>

      <hr />

      {/* FORM */}
      <h3>{editingId == null ? 'Create Appointment' : 'Edit Appointment'}</h3>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Physician select */}
        <div style={{ marginBottom: '1rem' }}>
          <label>Physician</label>
          <br />
          <select
            value={form.physicianId}
            onChange={handleChange('physicianId')}
            required
            style={{ width: '100%' }}
          >
            <option value={0} disabled>
              — Select a physician —
            </option>
            {physicians.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Date</label>
          <br />
          <input
            type="date"
            value={form.date}
            onChange={handleChange('date')}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Time</label>
          <br />
          <input
            type="time"
            value={form.time}
            onChange={handleChange('time')}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Reason for Visit</label>
          <br />
          <textarea
            value={form.reason}
            onChange={handleChange('reason')}
            required
            style={{ width: '100%', height: 80 }}
          />
        </div>

        <button type="submit" disabled={saving} style={{ marginRight: 8 }}>
          {saving ? 'Saving…' : editingId == null ? 'Create' : 'Save Changes'}
        </button>
        {editingId != null && (
          <button type="button" onClick={startNew}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}
