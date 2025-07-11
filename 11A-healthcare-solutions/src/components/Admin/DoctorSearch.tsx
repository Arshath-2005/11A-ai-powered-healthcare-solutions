import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Doctor, MedicalReport } from '../../types';
import { Eye, Pencil, Trash2, Search } from 'lucide-react';

const DoctorSearch: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as Doctor[];
    setDoctors(data);
  };

  const handleDelete = async (uid: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      await deleteDoc(doc(db, 'users', uid));
      fetchDoctors();
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
  };

  const handleUpdate = async () => {
    if (editingDoctor?.uid) {
      await updateDoc(doc(db, 'users', editingDoctor.uid), editingDoctor);
      setEditingDoctor(null);
      fetchDoctors();
    }
  };

  const handleViewReports = async (doctor: Doctor) => {
    const q = query(collection(db, 'medicalReports'), where('doctorId', '==', doctor.uid));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MedicalReport[];
    setReports(data);
    setSelectedDoctor(doctor);
  };

  const filteredDoctors = doctors.filter(d =>
    (d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     d.specialization.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!specialization || d.specialization === specialization)
  );

  const specializations = Array.from(new Set(doctors.map(d => d.specialization)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-10">👨‍⚕️ Doctor Directory</h1>

        {/* Search & Filter */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or specialization"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={specialization}
              onChange={e => setSpecialization(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Cards */}
        {filteredDoctors.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No doctors found for your search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map(doc => (
              <div key={doc.uid} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">{doc.name}</h2>
                  <p className="text-teal-600 font-medium">{doc.specialization}</p>
                </div>
                <div className="text-sm text-gray-700 space-y-1 mb-4">
                  <p><strong>Email:</strong> {doc.email}</p>
                  <p><strong>Phone:</strong> {doc.phone || 'N/A'}</p>
                  <p><strong>Qualification:</strong> {doc.qualification}</p>
                  <p><strong>Experience:</strong> {doc.experience} years</p>
                  <p><strong>Fee:</strong> ₹{doc.consultationFee}</p>
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => handleViewReports(doc)}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> View
                  </button>
                  <button
                    onClick={() => handleEdit(doc)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-xl"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.uid)}
                    className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Reports Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-teal-700">Reports by Dr. {selectedDoctor.name}</h2>
                <button onClick={() => setSelectedDoctor(null)} className="text-gray-500 hover:text-black text-xl">×</button>
              </div>
              {reports.length === 0 ? (
                <p className="text-center text-gray-500">No reports available.</p>
              ) : (
                reports.map(report => (
                  <div key={report.id} className="p-4 border rounded-lg mb-4 bg-gray-50">
                    <p className="text-sm font-bold">Patient: {report.patientName}</p>
                    <p className="text-sm">Date: {new Date(report.createdAt).toDateString()}</p>
                    <p className="text-sm">Diagnosis: {report.diagnosis}</p>
                    <p className="text-sm">Prescription: {report.prescription}</p>
                    {report.notes && <p className="text-sm">Notes: {report.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-bold text-teal-700 mb-4">Edit Doctor</h2>
              <input
                type="text"
                placeholder="Name"
                value={editingDoctor.name || ''}
                onChange={e => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                className="w-full mb-3 px-4 py-2 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Phone"
                value={editingDoctor.phone || ''}
                onChange={e => setEditingDoctor({ ...editingDoctor, phone: e.target.value })}
                className="w-full mb-3 px-4 py-2 border rounded-xl"
              />
              <input
                type="text"
                placeholder="Qualification"
                value={editingDoctor.qualification || ''}
                onChange={e => setEditingDoctor({ ...editingDoctor, qualification: e.target.value })}
                className="w-full mb-3 px-4 py-2 border rounded-xl"
              />
              <input
                type="number"
                placeholder="Consultation Fee"
                value={editingDoctor.consultationFee || ''}
                onChange={e => setEditingDoctor({ ...editingDoctor, consultationFee: Number(e.target.value) })}
                className="w-full mb-4 px-4 py-2 border rounded-xl"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingDoctor(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button onClick={handleUpdate} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSearch;
