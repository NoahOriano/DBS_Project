// pages/physician/Prescriptions.tsx
import { useState, useEffect } from 'react';
import api from '../../api';

interface Patient {
  Patient_ID: number;
  Patient_Name: string;
}

interface Prescription {
  Prescription_ID: number;
  Issued_Date: string;
  Notes: string;
  Prescribing_Physician: string;
  Medication_Name: string;
  Dosage: string;
  Frequency: string;
  Refills: number;
}

export default function Prescriptions() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    refills: 0,
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPrescriptions(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/physician/patients');
      setPatients(response.data as Patient[]);
    } catch (err) {
      setError('Failed to load patients');
    }
  };

  const fetchPrescriptions = async (patientId: string) => {
    try {
      const response = await api.get(`/physician/prescriptions/patient/${patientId}`);
      setPrescriptions(response.data as Prescription[]);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/physician/prescription', {
        patientId: selectedPatient,
        ...formData
      });
      setMessage('Prescription created successfully');
      setFormData({
        medicationName: '',
        dosage: '',
        frequency: '',
        refills: 0,
        notes: ''
      });
      fetchPrescriptions(selectedPatient);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Prescriptions</h1>

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
              <h2 className="text-2xl font-semibold mb-4">Create New Prescription</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medication Name</label>
                  <input
                    type="text"
                    name="medicationName"
                    value={formData.medicationName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dosage</label>
                  <input
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <input
                    type="text"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                    placeholder="e.g., Twice daily"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Refills</label>
                  <input
                    type="number"
                    name="refills"
                    value={formData.refills}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows={3}
                    placeholder="Additional instructions or notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? 'Creating...' : 'Create Prescription'}
                </button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Prescription History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border-b text-left">Date</th>
                      <th className="px-4 py-2 border-b text-left">Medication</th>
                      <th className="px-4 py-2 border-b text-left">Dosage</th>
                      <th className="px-4 py-2 border-b text-left">Frequency</th>
                      <th className="px-4 py-2 border-b text-left">Refills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((prescription) => (
                      <tr key={prescription.Prescription_ID}>
                        <td className="px-4 py-2 border-b">
                          {new Date(prescription.Issued_Date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 border-b">{prescription.Medication_Name}</td>
                        <td className="px-4 py-2 border-b">{prescription.Dosage}</td>
                        <td className="px-4 py-2 border-b">{prescription.Frequency}</td>
                        <td className="px-4 py-2 border-b">{prescription.Refills}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
