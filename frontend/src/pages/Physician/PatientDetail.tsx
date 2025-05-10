// pages/physician/PatientDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';

interface PatientDetails {
  Patient_ID: number;
  First_Name: string;
  Last_Name: string;
  Date_Of_Birth: string;
  Gender: string;
  Medical_Record_Number: string;
  Contact_Phone: string;
  Contact_Email: string;
  Home_Address: string;
  Primary_Care_Physician: string;
  Insurance_Provider: string;
  Insurance_Policy_Number: string;
  Emergency_Contact_Name: string;
  Emergency_Contact_Rel: string;
  Known_Allergies: string;
}

interface CurrentBed {
  Bed_ID: number;
  Bed_Number: string;
  Ward: string;
  Assigned_Date: string;
}

export default function PatientDetail() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [currentBed, setCurrentBed] = useState<CurrentBed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchCurrentBed();
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      const response = await api.get(`/physician/patient/${patientId}`);
      setPatient(response.data as PatientDetails);
    } catch (err) {
      setError('Failed to load patient details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentBed = async () => {
    try {
      const response = await api.get(`/physician/patient/${patientId}/bed`);
      setCurrentBed(response.data as CurrentBed);
    } catch (err) {
      console.error('No bed assigned or error fetching bed info:', err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!patient) return <div className="text-center">Patient not found</div>;

  return (

      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Patient Details</h1>
          <div className="space-x-4">
            <Link
              to={`/physician/discharge/${patientId}`}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Discharge Patient
            </Link>
            <Link
              to="/physician/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {patient.First_Name} {patient.Last_Name}
              </div>
              <div>
                <span className="font-medium">DOB:</span> {new Date(patient.Date_Of_Birth).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Gender:</span> {patient.Gender}
              </div>
              <div>
                <span className="font-medium">Medical Record #:</span> {patient.Medical_Record_Number}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Phone:</span> {patient.Contact_Phone}
              </div>
              <div>
                <span className="font-medium">Email:</span> {patient.Contact_Email}
              </div>
              <div>
                <span className="font-medium">Address:</span> {patient.Home_Address}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Medical Information</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Primary Care Physician:</span> {patient.Primary_Care_Physician}
              </div>
              <div>
                <span className="font-medium">Known Allergies:</span> {patient.Known_Allergies || 'None'}
              </div>
              {currentBed && (
                <div>
                  <span className="font-medium">Current Bed:</span> {currentBed.Bed_Number} ({currentBed.Ward})
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Insurance & Emergency Contact</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Insurance Provider:</span> {patient.Insurance_Provider}
              </div>
              <div>
                <span className="font-medium">Policy Number:</span> {patient.Insurance_Policy_Number}
              </div>
              <div>
                <span className="font-medium">Emergency Contact:</span> {patient.Emergency_Contact_Name} ({patient.Emergency_Contact_Rel})
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={`/physician/soap-notes?patient=${patientId}`}
            className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700"
          >
            SOAP Notes
          </Link>
          <Link
            to={`/physician/lab-orders?patient=${patientId}`}
            className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700"
          >
            Lab Orders
          </Link>
          <Link
            to={`/physician/prescriptions?patient=${patientId}`}
            className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700"
          >
            Prescriptions
          </Link>
        </div>
      </div>
  );
}
