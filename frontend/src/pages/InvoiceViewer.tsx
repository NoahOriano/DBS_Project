import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

type Invoice = {
  Bill_ID: number;
  Patient: string;
  Bill_Date: string;
  Total_Charges: number;
  Patient_Responsibility: number;
  Paid: number;
  Balance: number;
};

export default function InvoiceViewer() {
  const { billId } = useParams<{ billId?: string }>(); // Make billId optional
  const [inv, setInv] = useState<Invoice | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (billId) {
      // Fetch specific invoice if billId is provided
      api.get<Invoice>(`/admin/invoice/${billId}`)
        .then((r) => setInv(r.data))
        .catch((e) => setErr(e.response?.data?.message || 'Not found'));
    } else {
      // Fetch generic invoice data if no billId is provided
      api.get<Invoice>('/admin/invoice')
        .then((r) => setInv(r.data))
        .catch((e) => setErr(e.response?.data?.message || 'Failed to load invoices'));
    }
  }, [billId]);

  if (err) return <p className="error">{err}</p>;
  if (!inv) return <p>Loading…</p>;

  return (
    <div className="page">
      <h2>{billId ? `Invoice #${inv.Bill_ID}` : 'Generic Invoice Viewer'}</h2>
      <p><strong>Patient:</strong> {inv.Patient}</p>
      <p><strong>Date:</strong> {inv.Bill_Date}</p>
      <hr />
      <table>
        <tbody>
          <tr><td>Total Charges</td><td>${inv.Total_Charges.toFixed(2)}</td></tr>
          <tr><td>Insurance / Patient Resp.</td><td>${inv.Patient_Responsibility.toFixed(2)}</td></tr>
          <tr><td>Paid to Date</td><td>${inv.Paid.toFixed(2)}</td></tr>
          <tr><td><strong>Balance</strong></td><td><strong>${inv.Balance.toFixed(2)}</strong></td></tr>
        </tbody>
      </table>
    </div>
  );
}