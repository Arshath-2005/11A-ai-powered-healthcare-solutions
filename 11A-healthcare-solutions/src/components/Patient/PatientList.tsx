import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Eye, Edit, Trash2, Save, Check, Droplet, X } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Patient } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const PatientList: React.FC = () => {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<Patient> & { uid: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientsQuery = query(collection(db, 'users'), where('role', '==', 'patient'));
        const snapshot = await getDocs(patientsQuery);
        const patientsData = snapshot.docs.map(doc => ({
          ...(doc.data() as Patient),
          uid: doc.id
        }));
        setPatients(patientsData);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      await deleteDoc(doc(db, 'users', patientId));
      setPatients(prev => prev.filter(p => p.uid !== patientId));
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditedPatient(patient);
    setEditMode(true);
  };

  const handleSavePatient = async () => {
    if (editedPatient && editedPatient.uid) {
      try {
        const { uid, ...dataToUpdate } = editedPatient;
        await updateDoc(doc(db, 'users', uid), dataToUpdate);
        setPatients(prev => prev.map(p => p.uid === uid ? { ...p, ...dataToUpdate } : p));
        setEditMode(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error('Error updating patient:', error);
      }
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchName = patient.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchPhone = phoneFilter === '' || (patient.phone && patient.phone.startsWith(phoneFilter));
    const matchBlood = bloodFilter === '' || patient.bloodGroup === bloodFilter;
    const matchAge = ageFilter === '' || patient.age?.toString() === ageFilter;
    return matchName && matchPhone && matchBlood && matchAge;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-6 sm:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Patient Management</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-xl shadow">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="Search by phone..."
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-teal-500"
          />
          <input
            type="number"
            placeholder="Search by age..."
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-teal-500"
          />
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-teal-500"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-green-700 text-lg mt-4 font-semibold">Patient Updated!</h3>
            </div>
          </div>
        )}

        {/* Patient Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.uid} className="bg-white p-4 sm:p-6 rounded-2xl shadow hover:shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-teal-100 p-3 rounded-full">
                  <User className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{patient.name}</h3>
                  <p className="text-sm text-gray-600">Age: {patient.age}</p>
                </div>
              </div>
              <div className="text-sm text-gray-700 space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{patient.phone}</span>
                </div>
                {patient.bloodGroup && (
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-red-500" />
                    <span>Blood Group: {patient.bloodGroup}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="flex-1 bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                {userProfile?.role === 'admin' && (
                  <>
                    <button onClick={() => handleEditPatient(patient)} className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeletePatient(patient.uid)} className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md mx-4 shadow-xl relative">
              <button
                onClick={() => setSelectedPatient(null)}
                className="absolute top-3 right-3 text-gray-600 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-4 text-teal-600">Patient Details</h2>
              <p><strong>Name:</strong> {selectedPatient.name}</p>
              <p><strong>Age:</strong> {selectedPatient.age}</p>
              <p><strong>Email:</strong> {selectedPatient.email}</p>
              <p><strong>Phone:</strong> {selectedPatient.phone}</p>
              <p><strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editMode && editedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg mx-4 shadow-xl">
              <h3 className="text-xl font-bold text-teal-700 mb-4">Edit Patient</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={editedPatient.name || ''}
                  onChange={(e) => setEditedPatient({ ...editedPatient, name: e.target.value })}
                  className="w-full border px-4 py-2 rounded-lg"
                  placeholder="Name"
                />
                <input
                  type="number"
                  value={editedPatient.age || ''}
                  onChange={(e) => setEditedPatient({ ...editedPatient, age: Number(e.target.value) })}
                  className="w-full border px-4 py-2 rounded-lg"
                  placeholder="Age"
                />
                <input
                  type="text"
                  value={editedPatient.phone || ''}
                  onChange={(e) => setEditedPatient({ ...editedPatient, phone: e.target.value })}
                  className="w-full border px-4 py-2 rounded-lg"
                  placeholder="Phone"
                />
                <input
                  type="text"
                  value={editedPatient.bloodGroup || ''}
                  onChange={(e) => setEditedPatient({ ...editedPatient, bloodGroup: e.target.value })}
                  className="w-full border px-4 py-2 rounded-lg"
                  placeholder="Blood Group"
                />
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                  <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
                  <button onClick={handleSavePatient} className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-1">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientList;
