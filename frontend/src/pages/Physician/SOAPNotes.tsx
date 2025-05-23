// pages/physician/SOAPNotes.tsx
import { useState, useEffect } from 'react';
import api from '../../api';

interface Patient {
  Patient_ID: number;
  Patient_Name: string;
}

interface SOAPNote {
  SOAP_ID: number;
  Patient_ID: number;
  Note_DateTime: string;
  Subjective: string;
  Objective: string;
  Assessment: string;
  Plan: string;
  Patient_Name: string;
  Physician_Name: string;
}

export default function SOAPNotes() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [notes, setNotes] = useState<SOAPNote[]>([]);
  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchNotes(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const response = await api.get<Patient[]>('/physician/patients');
      setPatients(response.data);
    } catch (err) {
      setError('Failed to load patients');
    }
  };

  const fetchNotes = async (patientId: string) => {
    try {
      const response = await api.get<SOAPNote[]>(`/physician/soap/${patientId}`);
      setNotes(response.data);
    } catch (err) {
      setError('Failed to load SOAP notes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/physician/soap', {
        patientId: selectedPatient,
        ...formData
      });
      setMessage('SOAP note created successfully');
      setFormData({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      });
      fetchNotes(selectedPatient);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create SOAP note');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">SOAP Notes</h1>

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
              <h2 className="text-2xl font-semibold mb-4">Create New SOAP Note</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subjective</label>
                  <textarea
                    name="subjective"
                    value={formData.subjective}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Objective</label>
                  <textarea
                    name="objective"
                    value={formData.objective}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Assessment</label>
                  <textarea
                    name="assessment"
                    value={formData.assessment}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Plan</label>
                  <textarea
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows={3}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? 'Saving...' : 'Save SOAP Note'}
                </button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Previous SOAP Notes</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.SOAP_ID} className="border rounded p-4">
                    <div className="font-semibold mb-2">
                      {new Date(note.Note_DateTime).toLocaleString()}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <strong>Subjective:</strong> {note.Subjective}
                      </div>
                      <div>
                        <strong>Objective:</strong> {note.Objective}
                      </div>
                      <div>
                        <strong>Assessment:</strong> {note.Assessment}
                      </div>
                      <div>
                        <strong>Plan:</strong> {note.Plan}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
