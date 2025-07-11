import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, Stethoscope, Search, Check } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Doctor, Appointment } from '../../types';
import { notifyNewAppointment } from '../../utils/notificationHelpers';

const BookAppointment: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const preselectedDoctor = (location.state as { doctor?: Doctor })?.doctor || null;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(preselectedDoctor);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    symptoms: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...(doc.data() as Omit<Doctor, 'uid'>)
        }));
        setDoctors(data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const specializations = [...new Set(doctors.map(doc => doc.specialization))];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization = !selectedSpecialization || doc.specialization === selectedSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  const handleBookAppointment = async () => {
    if (!currentUser || !selectedDoctor || !appointmentData.date || !appointmentData.time) {
      alert('Please fill in all required fields');
      return;
    }

    setBooking(true);
    try {
      const newAppointment = {
        patientId: currentUser.uid,
        doctorId: selectedDoctor.uid,
        patientName: userProfile?.name || 'Patient',
        doctorName: selectedDoctor.name,
        date: Timestamp.fromDate(new Date(appointmentData.date)),
        time: appointmentData.time,
        status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
        symptoms: appointmentData.symptoms,
        notes: appointmentData.notes,
        createdAt: Timestamp.now(),
      };

      // Add appointment to Firestore
      const docRef = await addDoc(collection(db, 'appointments'), newAppointment);
      
      // Create appointment object with ID for notifications
      const appointment: Appointment = {
        id: docRef.id,
        ...newAppointment,
        date: new Date(appointmentData.date),
        createdAt: new Date(),
      };
      
      // Send notifications to both patient and doctor
      await notifyNewAppointment(
        appointment,
        currentUser.uid,
        selectedDoctor.uid
      );
      
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setSelectedDoctor(null);
        setAppointmentData({ date: '', time: '', symptoms: '', notes: '' });
      }, 3000);
    } catch (err) {
      console.error('Booking failed:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
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
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-80 mx-4 animate-bounce">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
                <p className="text-gray-600 mb-4">Your appointment has been booked successfully</p>
                <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Book Your Appointment</h1>
          <p className="text-gray-600 text-lg">Find and book with the best doctors</p>
        </div>

        {/* Doctor Selection or Appointment Form */}
        {!selectedDoctor ? (
          <>
            <div className="bg-white rounded-2xl shadow p-4 sm:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search doctors or specializations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.uid} className="bg-white rounded-2xl shadow p-4 sm:p-6 hover:shadow-lg transition">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-8 h-8 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{doctor.name}</h3>
                      <p className="text-teal-600">{doctor.specialization}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p>Experience: {doctor.experience} yrs</p>
                    <p>Fee: ₹{doctor.consultationFee}</p>
                    {doctor.rating && <p>Rating: {doctor.rating} ★</p>}
                  </div>
                  <button
                    onClick={() => setSelectedDoctor(doctor)}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800"
                  >
                    Select Doctor
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Book Appointment with Dr. {selectedDoctor.name}</h2>
              <button onClick={() => setSelectedDoctor(null)} className="text-teal-600 hover:underline">
                ← Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Time
                </label>
                <select
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Symptoms</label>
              <textarea
                rows={3}
                value={appointmentData.symptoms}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, symptoms: e.target.value }))}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-teal-500"
                placeholder="Describe your symptoms (optional)"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Additional Notes</label>
              <textarea
                rows={2}
                value={appointmentData.notes}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-teal-500"
                placeholder="Any additional information"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-6 py-2 border border-gray-400 rounded-xl text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={booking || !appointmentData.date || !appointmentData.time}
                className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 disabled:opacity-50"
              >
                {booking ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
