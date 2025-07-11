import React, { useState, useEffect } from 'react';
import { Search, Stethoscope, Star, Phone, Mail, Eye, Edit, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Doctor } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ReactDOM from 'react-dom';

const DoctorList: React.FC = () => {
  const { userProfile } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsQuery = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const snapshot = await getDocs(doctorsQuery);
        const doctorsData = snapshot.docs.map(doc => ({
          ...(doc.data() as Doctor),
          uid: doc.id,
        }));
        setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setDoctors(prev => prev.filter(d => d.uid !== id));
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  const specializations = [...new Set(doctors.map(d => d.specialization))];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.qualification.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpec = !selectedSpecialization || doctor.specialization === selectedSpecialization;
    const matchesExp = !selectedExperience || (
      selectedExperience === '0-5' ? doctor.experience <= 5 :
      selectedExperience === '6-15' ? doctor.experience >= 6 && doctor.experience <= 15 :
      selectedExperience === '15+' ? doctor.experience > 15 : true
    );

    return matchesSearch && matchesSpec && matchesExp;
  });

  const renderModal = () => {
    if (!selectedDoctor) return null;

    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[999] bg-black bg-opacity-60 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">
          <button
            onClick={() => setSelectedDoctor(null)}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          >×</button>
          <h2 className="text-2xl font-bold text-teal-700 mb-6">Doctor Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div><strong>Name:</strong> <p>{selectedDoctor.name}</p></div>
            <div><strong>Specialization:</strong> <p>{selectedDoctor.specialization}</p></div>
            <div><strong>Email:</strong> <p>{selectedDoctor.email}</p></div>
            <div><strong>Phone:</strong> <p>{selectedDoctor.phone || 'N/A'}</p></div>
            <div><strong>Experience:</strong> <p>{selectedDoctor.experience} years</p></div>
            <div><strong>Qualification:</strong> <p>{selectedDoctor.qualification}</p></div>
            <div><strong>Consultation Fee:</strong> <p>₹{selectedDoctor.consultationFee}</p></div>
            {selectedDoctor.rating && (
              <div><strong>Rating:</strong> <p>{selectedDoctor.rating}/5.0</p></div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={selectedSpecialization}
              onChange={e => setSelectedSpecialization(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <select
              value={selectedExperience}
              onChange={e => setSelectedExperience(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="">All Experience</option>
              <option value="0-5">0-5 years</option>
              <option value="6-15">6-15 years</option>
              <option value="15+">15+ years</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.uid} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{doctor.name}</h3>
                  <p className="text-teal-600 font-medium">{doctor.specialization}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{doctor.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{doctor.phone || 'Not provided'}</span></div>
                <div className="flex items-center gap-2"><Star className="w-4 h-4" /><span>{doctor.experience} years</span></div>
                {doctor.rating && (
                  <div className="flex items-center gap-2 text-yellow-600"><Star className="w-4 h-4" /><span>{doctor.rating}/5</span></div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDoctor(doctor)}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-2 rounded-xl text-sm font-semibold"
                >
                  <Eye className="w-4 h-4 inline mr-1" /> View
                </button>
                {userProfile?.role === 'admin' && (
                  <>
                    <button className="bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-xl">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doctor.uid)}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {renderModal()}
      </div>
    </div>
  );
};

export default DoctorList;
