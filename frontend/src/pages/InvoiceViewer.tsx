import React, { useEffect, useState } from 'react';
import api from '../api';

type Invoice = {
  Bill_ID: number;
  Patient_ID: number;
  Bill_Date: string;
  Total_Charges: number;
  Patient_Responsibility: number;
};

type Patient = {
  id: number;
  name: string;
};

export default function InvoiceViewer() {
  // State for patients and selected patient
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  // State for invoices for the selected patient
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Toggle for new invoice form
  const [showNew, setShowNew] = useState(false);
  // newInvoice now only uses fields in Invoice except Bill_ID and Patient_ID
  const [newInvoice, setNewInvoice] = useState<Omit<Invoice, 'Bill_ID' | 'Patient_ID'>>({
    Bill_Date: '',
    Total_Charges: 0,
    Patient_Responsibility: 0,
  });

  // Load patients on mount
  useEffect(() => {
    async function loadPatients() {
      try {
        const { data } = await api.get<Patient[]>('/admin/patients');
        setPatients(data);
      } catch (e: any) {
        setErr(e.response?.data?.message || 'Failed to load patients');
      }
    }
    loadPatients();
  }, []);

  // When a patient is selected, load that patient's invoices
  useEffect(() => {
    async function loadInvoices() {
      if (!selectedPatient) {
        setInvoices([]);
        setLoading(false);
        return;
      }
      try {
        // Endpoint accepts a patientId query parameter
        const { data } = await api.get<Invoice[]>(`/admin/invoice?patientId=${selectedPatient}`);
        setInvoices(data);
        setErr(null);
      } catch (e: any) {
        setErr(e.response?.data?.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [selectedPatient]);

  const handleNewInvoiceChange = <K extends keyof typeof newInvoice>(key: K) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewInvoice({ ...newInvoice, [key]: e.target.value });
  };

  const handleNewInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      // POST new invoice – send the patient id under "Patient" (to match the admin route)
      const { data: created } = await api.post<Invoice>('/admin/invoice', {
        Patient: selectedPatient,
        ...newInvoice,
      });
      setInvoices((prev) => [...prev, created]);
      setShowNew(false);
      // Clear form
      setNewInvoice({ Bill_Date: '', Total_Charges: 0, Patient_Responsibility: 0 });
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to create invoice');
    }
  };

  return (
    <div className="page" style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h2>Invoice Viewer</h2>
      
      {/* Dropdown to select patient */}
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Select Patient:{' '}
          <select
            value={selectedPatient || ''}
            onChange={(e) => setSelectedPatient(Number(e.target.value) || null)}
          >
            <option value="">-- Select a patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {err && <p className="error">{err}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {/* Invoices List */}
          {invoices.length === 0 ? (
            <p>No invoices available for this patient.</p>
          ) : (
            <table border={1} cellPadding={8} cellSpacing={0}>
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Date</th>
                  <th>Total Charges</th>
                  <th>Patient Responsibility</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.Bill_ID}>
                    <td>{inv.Bill_ID}</td>
                    <td>{inv.Bill_Date}</td>
                    <td>${inv.Total_Charges.toFixed(2)}</td>
                    <td>${inv.Patient_Responsibility.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Toggle New Invoice Form */}
          <button onClick={() => setShowNew(!showNew)} style={{ marginTop: '1rem' }}>
            {showNew ? 'Cancel' : 'New Invoice'}
          </button>

          {showNew && (
            <form onSubmit={handleNewInvoiceSubmit} style={{ marginTop: '1rem' }}>
              <h3>Create Invoice</h3>
              <div>
                <label>
                  Bill Date:
                  <input
                    type="date"
                    value={newInvoice.Bill_Date}
                    onChange={handleNewInvoiceChange('Bill_Date')}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Total Charges:
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.Total_Charges}
                    onChange={handleNewInvoiceChange('Total_Charges')}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Patient Responsibility:
                  <input
                    type="number"
                    step="0.01"
                    value={newInvoice.Patient_Responsibility}
                    onChange={handleNewInvoiceChange('Patient_Responsibility')}
                    required
                  />
                </label>
              </div>
              <button type="submit" style={{ marginTop: '1rem' }}>
                Create Invoice
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}