import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import api from '../api';

interface Bill {
  Bill_ID: number;
  Bill_Date: string;
  Total_Charges: number;
  Patient_Responsibility: number;
  Total_Paid: number;
  Balance_Due: number;
}

// Interface for the raw data from API before parsing numbers
interface RawBillData {
  Bill_ID: number;
  Bill_Date: string;
  Total_Charges: string;
  Patient_Responsibility: string;
  Total_Paid: string;
  Balance_Due: string;
}

export default function PatientPayments() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'Check' | 'ACH'>('Card');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchPatientBills = async () => {
    setIsLoadingBills(true);
    setFetchError(null);
    try {
      const response = await api.get<RawBillData[]>('/patient/bills');
      // Parse string numbers to actual numbers
      const parsedBills: Bill[] = response.data.map(rawBill => ({
        ...rawBill,
        Total_Charges: parseFloat(rawBill.Total_Charges),
        Patient_Responsibility: parseFloat(rawBill.Patient_Responsibility),
        Total_Paid: parseFloat(rawBill.Total_Paid),
        Balance_Due: parseFloat(rawBill.Balance_Due),
      }));
      setBills(parsedBills);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setFetchError(err.response?.data?.message || 'Failed to load bills.');
      }
      setBills([]);
    } finally {
      setIsLoadingBills(false);
    }
  };

  useEffect(() => {
    fetchPatientBills();
  }, []);

  const handleSelectBillToPay = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.Balance_Due > 0 ? bill.Balance_Due.toFixed(2) : '');
    setPaymentMessage(null);
    setPaymentError(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) {
      setPaymentError('No bill selected for payment.');
      return;
    }
    
    const amountToPay = parseFloat(paymentAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      setPaymentError('Please enter a valid payment amount.');
      return;
    }
    if (amountToPay > selectedBill.Balance_Due) {
      setPaymentError('Payment amount cannot exceed the balance due.');
      return;
    }

    setIsSubmitting(true);
    setPaymentMessage(null);
    setPaymentError(null);

    try {
      await api.post('/patient/payments', {
        billId: selectedBill.Bill_ID,
        amount: amountToPay,
        method: paymentMethod,
      });
      setPaymentMessage('Payment submitted successfully! Your bill information will update shortly.');
      setSelectedBill(null);
      setPaymentAmount('');
      fetchPatientBills(); 
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Payment failed. Please try again.');
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h2>My Bills & Payments</h2>

      {fetchError && <div style={{ color: 'red', marginBottom: '1rem' }}>{fetchError}</div>}
      {isLoadingBills && <p>Loading your bills...</p>}

      {!isLoadingBills && bills.length === 0 && !fetchError && (
        <p>You have no outstanding bills at the moment.</p>
      )}

      {!isLoadingBills && bills.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Bill ID</th>
              <th style={tableHeaderStyle}>Date</th>
              <th style={tableHeaderStyle}>Total Charges</th>
              <th style={tableHeaderStyle}>Patient Responsibility</th>
              <th style={tableHeaderStyle}>Total Paid</th>
              <th style={tableHeaderStyle}>Balance Due</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.Bill_ID}>
                <td style={tableCellStyle}>{bill.Bill_ID}</td>
                <td style={tableCellStyle}>{new Date(bill.Bill_Date).toLocaleDateString()}</td>
                <td style={tableCellStyle}>${bill.Total_Charges.toFixed(2)}</td>
                <td style={tableCellStyle}>${bill.Patient_Responsibility.toFixed(2)}</td>
                <td style={tableCellStyle}>${bill.Total_Paid.toFixed(2)}</td>
                <td style={tableCellStyle}>${bill.Balance_Due.toFixed(2)}</td>
                <td style={tableCellStyle}>
                  {bill.Balance_Due > 0 && (
                    <button onClick={() => handleSelectBillToPay(bill)}>Pay Bill</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedBill && (
        <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
          <h3>Pay Bill #{selectedBill.Bill_ID}</h3>
          <p><strong>Balance Due:</strong> ${selectedBill.Balance_Due.toFixed(2)}</p>
          <form onSubmit={handlePaymentSubmit}>
            {paymentMessage && <div style={{ color: 'green', marginBottom: '1rem' }}>{paymentMessage}</div>}
            {paymentError && <div style={{ color: 'red', marginBottom: '1rem' }}>{paymentError}</div>}
            
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="paymentAmount">Amount to Pay ($):</label><br/>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                required
                step="0.01"
                min="0.01"
                max={selectedBill.Balance_Due.toFixed(2)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="paymentMethod">Payment Method:</label><br/>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                style={{ width: '100%' }}
              >
                <option value="Card">Card</option>
                <option value="Cash">Cash (Placeholder)</option>
                <option value="Check">Check (Placeholder)</option>
                <option value="ACH">ACH (Placeholder)</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ marginRight: '0.5rem' }}>
              {isSubmitting ? 'Processing...' : 'Submit Payment'}
            </button>
            <button type="button" onClick={() => setSelectedBill(null)} disabled={isSubmitting}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  borderBottom: '2px solid #ddd',
  padding: '8px',
  textAlign: 'left',
  backgroundColor: '#f2f2f2',
};

const tableCellStyle: React.CSSProperties = {
  borderBottom: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
};