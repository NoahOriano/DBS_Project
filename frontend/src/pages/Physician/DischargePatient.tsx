// pages/physician/DischargePatient.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

interface PatientInfo {
  Patient_ID: number;
  First_Name: string;
  Last_Name: string;
  Medical_Record_Number: string;
}

export default function DischargePatient() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
    }
  }, [patientId]);

  const fetchPatientInfo = async () => {
    try {
      const response = await api.get(`/physician/patient/${patientId}`);
      setPatient(response.data);
    } catch (err) {
      setError('Failed to load patient information');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/physician/patient/discharge', {
        patientId,
        dischargeDate,
        summary
      });
      navigate('/physician/dashboard', { 
        state: { message: 'Patient discharged successfully' }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to discharge patient');
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Discharge Patient</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Name:</span> {patient.First_Name} {patient.Last_Name}
          </div>
          <div>
            <span className="font-medium">Medical Record #:</span> {patient.Medical_Record_Number}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discharge Date</label>
            <input
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Discharge Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2 border rounded"
              rows={6}
              required
              placeholder="Enter discharge summary, including patient condition, treatment provided, and follow-up instructions..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-300"
            >
              {loading ? 'Processing...' : 'Discharge Patient'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}