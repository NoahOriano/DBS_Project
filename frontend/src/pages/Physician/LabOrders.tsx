// pages/physician/LabOrders.tsx
import { useState, useEffect } from 'react';
import api from '../../api';

interface Patient {
  Patient_ID: number;
  Patient_Name: string;
}

interface LabTest {
  LabTest_ID: number;
  Test_Type: string;
  Date_Ordered: string;
  Date_Completed: string | null;
  Result_Status: string;
  Test_Results: string | null;
  Ordering_Physician: string;
  Technician: string | null;
}

export default function LabOrders() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [formData, setFormData] = useState({
    testType: '',
    dateOrdered: new Date().toISOString().split('T')[0],
    urgency: 'Routine'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchLabTests(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/physician/patients');
      setPatients(response.data);
    } catch (err) {
      setError('Failed to load patients');
    }
  };

  const fetchLabTests = async (patientId: string) => {
    try {
      const response = await api.get(`/physician/lab/patient/${patientId}`);
      setLabTests(response.data);
    } catch (err) {
      console.error('Failed to load lab tests:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/physician/lab/order', {
        patientId: selectedPatient,
        ...formData
      });
      setMessage('Lab test ordered successfully');
      setFormData({
        testType: '',
        dateOrdered: new Date().toISOString().split('T')[0],
        urgency: 'Routine'
      });
      fetchLabTests(selectedPatient);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to order lab test');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Lab Orders</h1>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Patient</label>
        <select
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          className="w-full md:w-1/3 p-2 border rounded"
        >
          <option value="">Select a patient</option>
          {patients.map((patient) => (
            <option key={patient.Patient_ID} value={patient.Patient_ID}>
              {patient.Patient_Name}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Order New Lab Test</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Test Type</label>
                <input
                  type="text"
                  name="testType"
                  value={formData.testType}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                  placeholder="e.g., Blood Test, X-Ray, MRI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date Ordered</label>
                <input
                  type="date"
                  name="dateOrdered"
                  value={formData.dateOrdered}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Urgency</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Ordering...' : 'Order Lab Test'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Lab Test History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border-b text-left">Test Type</th>
                    <th className="px-4 py-2 border-b text-left">Date Ordered</th>
                    <th className="px-4 py-2 border-b text-left">Status</th>
                    <th className="px-4 py-2 border-b text-left">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {labTests.map((test) => (
                    <tr key={test.LabTest_ID}>
                      <td className="px-4 py-2 border-b">{test.Test_Type}</td>
                      <td className="px-4 py-2 border-b">
                        {new Date(test.Date_Ordered).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 border-b">{test.Result_Status}</td>
                      <td className="px-4 py-2 border-b">
                        {test.Test_Results || 'Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}