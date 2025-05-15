import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// Type for viewing an existing invoice
type InvoiceView = {
  Bill_ID: number;
  Patient: string; // Patient Name
  Bill_Date: string;
  Total_Charges: number;
  Patient_Responsibility: number;
  Paid: number;
  Balance: number;
};

// Type for creating a new invoice (data to send to backend)
type NewInvoiceData = {
  patientId: string; // Or number, depending on how you handle it
  totalCharges: number;
  patientResponsibility: number;
  billDate: string; // YYYY-MM-DD
};

export default function InvoiceViewer() {
  const { billId: paramBillId } = useParams<{ billId?: string }>();
  const navigate = useNavigate();

  // State for viewing existing invoice
  const [invoiceToView, setInvoiceToView] = useState<InvoiceView | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  // State for creating new invoice
  const [createPatientId, setCreatePatientId] = useState('');
  const [createTotalCharges, setCreateTotalCharges] = useState('');
  const [createPatientResponsibility, setCreatePatientResponsibility] = useState('');
  const [createBillDate, setCreateBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (paramBillId) {
      setViewError(null);
      setInvoiceToView(null);
      api.get<InvoiceView[]>(`/admin/invoice/${paramBillId}`) // spGenerateInvoice returns an array
        .then((r) => {
          if (r.data && r.data.length > 0 && r.data[0].length > 0) { // Adjust based on actual structure
            setInvoiceToView(r.data[0][0] as InvoiceView); // Assuming the SP returns data in a nested array
          } else {
            setInvoiceToView(null);
            setViewError('Invoice not found or data format is incorrect.');
          }
        })
        .catch((e) => {
          setViewError(e.response?.data?.message || `Invoice with ID ${paramBillId} not found.`);
          setInvoiceToView(null);
        });
    } else {
      // No billId in URL, so don't try to fetch an invoice to view
      setInvoiceToView(null);
    }
  }, [paramBillId]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateMessage(null);
    setIsCreating(true);

    if (!createPatientId || !createTotalCharges || !createPatientResponsibility || !createBillDate) {
      setCreateError('All fields are required to create an invoice.');
      setIsCreating(false);
      return;
    }

    const newInvoicePayload: NewInvoiceData = {
      patientId: createPatientId,
      totalCharges: parseFloat(createTotalCharges),
      patientResponsibility: parseFloat(createPatientResponsibility),
      billDate: createBillDate,
    };

    try {
      // Ensure this endpoint matches your backend implementation
      const response = await api.post('/admin/billings', newInvoicePayload);
      setCreateMessage(`Invoice created successfully! New Bill ID: ${response.data.billId}`);
      // Clear form
      setCreatePatientId('');
      setCreateTotalCharges('');
      setCreatePatientResponsibility('');
      setCreateBillDate(new Date().toISOString().split('T')[0]);
      // Optionally navigate to the newly created invoice view
      // navigate(`/admin/invoice/${response.data.billId}`);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="page">
      {paramBillId && (
        <>
          <h2>Invoice Details {invoiceToView ? `#${invoiceToView.Bill_ID}` : ''}</h2>
          {viewError && <p className="error">{viewError}</p>}
          {!invoiceToView && !viewError && <p>Loading invoice details...</p>}
          {invoiceToView && (
            <div>
              <p><strong>Patient:</strong> {invoiceToView.Patient}</p>
              <p><strong>Date:</strong> {new Date(invoiceToView.Bill_Date).toLocaleDateString()}</p>
              <hr />
              <table>
                <tbody>
                  <tr><td>Total Charges</td><td>${invoiceToView.Total_Charges.toFixed(2)}</td></tr>
                  <tr><td>Patient Responsibility</td><td>${invoiceToView.Patient_Responsibility.toFixed(2)}</td></tr>
                  <tr><td>Paid to Date</td><td>${invoiceToView.Paid.toFixed(2)}</td></tr>
                  <tr><td><strong>Balance Due</strong></td><td><strong>${invoiceToView.Balance.toFixed(2)}</strong></td></tr>
                </tbody>
              </table>
            </div>
          )}
          <hr style={{ margin: '2rem 0' }} />
        </>
      )}

      <h2>Create New Invoice</h2>
      <form onSubmit={handleCreateInvoice}>
        {createMessage && <p style={{ color: 'green' }}>{createMessage}</p>}
        {createError && <p className="error">{createError}</p>}

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="patientId">Patient ID:</label><br/>
          <input
            type="text"
            id="patientId"
            value={createPatientId}
            onChange={(e) => setCreatePatientId(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="totalCharges">Total Charges ($):</label><br/>
          <input
            type="number"
            id="totalCharges"
            value={createTotalCharges}
            onChange={(e) => setCreateTotalCharges(e.target.value)}
            required
            step="0.01"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="patientResponsibility">Patient Responsibility ($):</label><br/>
          <input
            type="number"
            id="patientResponsibility"
            value={createPatientResponsibility}
            onChange={(e) => setCreatePatientResponsibility(e.target.value)}
            required
            step="0.01"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="billDate">Bill Date:</label><br/>
          <input
            type="date"
            id="billDate"
            value={createBillDate}
            onChange={(e) => setCreateBillDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Invoice'}
        </button>
      </form>
    </div>
  );
}