// pages/physician/BedManagement.tsx
import { useState, useEffect } from 'react';
import api from '../../api';

interface Bed {
  Bed_ID: number;
  Bed_Number: string;
  Ward: string;
  Status: string;
}

interface Patient {
  Patient_ID: number;
  Patient_Name: string;
}

export default function BedManagement() {
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedBed, setSelectedBed] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableBeds();
    fetchPatients();
  }, []);

  const fetchAvailableBeds = async () => {
    try {
      const response = await api.get('/physician/beds/available');
      setAvailableBeds(response.data);
    } catch (err) {
      setError('Failed to load available beds');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/physician/patients');
      setPatients(response.data);
    } catch (err) {
      setError('Failed to load patients');
    }
  };

  const handleAssignBed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      await api.post('/physician/bed/assign', {
        bedId: selectedBed,
        patientId: selectedPatient,
        assignedDate: assignDate
      });
      setMessage('Bed assigned successfully');
      fetchAvailableBeds();
      setSelectedBed('');
      setSelectedPatient('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign bed');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Bed Management</h1>
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Assign Bed</h2>
          <form onSubmit={handleAssignBed} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Patient</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.Patient_ID} value={patient.Patient_ID}>
                    {patient.Patient_Name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Select Bed</label>
              <select
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a bed</option>
                {availableBeds.map((bed) => (
                  <option key={bed.Bed_ID} value={bed.Bed_ID}>
                    {bed.Bed_Number} - {bed.Ward}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Assign Date</label>
              <input
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Assign Bed
            </button>
          </form>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Beds</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border-b">Bed Number</th>
                  <th className="px-4 py-2 border-b">Ward</th>
                  <th className="px-4 py-2 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {availableBeds.map((bed) => (
                  <tr key={bed.Bed_ID}>
                    <td className="px-4 py-2 border-b">{bed.Bed_Number}</td>
                    <td className="px-4 py-2 border-b">{bed.Ward}</td>
                    <td className="px-4 py-2 border-b">{bed.Status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}