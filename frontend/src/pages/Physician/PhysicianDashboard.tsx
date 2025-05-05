// pages/physician/PhysicianDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

interface Patient {
  Patient_ID: number;
  Patient_Name: string;
  Date_Of_Birth: string;
  Medical_Record_Number: string;
  Contact_Phone: string;
  Contact_Email: string;
}

export default function PhysicianDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/physician/patients');
      setPatients(response.data as Patient[]);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Physician Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/physician/bed-management" className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Bed Management</h2>
          <p className="text-gray-600">Assign and manage patient beds</p>
        </Link>
        
        <Link to="/physician/soap-notes" className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">SOAP Notes</h2>
          <p className="text-gray-600">Create and view patient notes</p>
        </Link>
        
        <Link to="/physician/lab-orders" className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Lab Orders</h2>
          <p className="text-gray-600">Order and review lab tests</p>
        </Link>
        
        <Link to="/physician/prescriptions" className="p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Prescriptions</h2>
          <p className="text-gray-600">Manage patient medications</p>
        </Link>
      </div>

      <h2 className="text-2xl font-semibold mb-4">My Patients</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b text-left">Patient Name</th>
              <th className="px-6 py-3 border-b text-left">DOB</th>
              <th className="px-6 py-3 border-b text-left">Medical Record #</th>
              <th className="px-6 py-3 border-b text-left">Contact</th>
              <th className="px-6 py-3 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.Patient_ID} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{patient.Patient_Name}</td>
                <td className="px-6 py-4 border-b">
                  {new Date(patient.Date_Of_Birth).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 border-b">{patient.Medical_Record_Number}</td>
                <td className="px-6 py-4 border-b">{patient.Contact_Phone}</td>
                <td className="px-6 py-4 border-b">
                  <Link 
                    to={`/physician/patient/${patient.Patient_ID}`}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    View Details
                  </Link>
                  <Link 
                    to={`/physician/discharge/${patient.Patient_ID}`}
                    className="text-red-600 hover:text-red-800"
                  >
                    Discharge
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}