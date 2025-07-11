import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Clock, TrendingUp, Activity } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, Patient } from '../../types';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch all appointments
        const appointmentsCollection = collection(db, 'appointments');
        const appointmentsSnapshot = await getDocs(appointmentsCollection);
        const allAppointmentsData = appointmentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            patientId: data.patientId || '',
            doctorId: data.doctorId || '',
            patientName: data.patientName || '',
            doctorName: data.doctorName || '',
            date: data.date ? data.date.toDate() : new Date(),
            time: data.time || '',
            status: data.status || 'scheduled',
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          } as Appointment;
        });
        
        // Filter appointments for the current doctor
        const doctorAppointments = allAppointmentsData.filter(
          appointment => appointment.doctorId === currentUser.uid
        );
        
        // Fetch all patients
        const patientsCollection = collection(db, 'users');
        const patientsQuery = query(patientsCollection, where('role', '==', 'patient'));
        const patientsSnapshot = await getDocs(patientsQuery);
        const allPatientsData = patientsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            uid: doc.id,
            role: 'patient',
            name: data.name || 'Unknown Patient',
            email: data.email || '',
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          } as Patient;
        });
        
        // Get patients who have appointments with this doctor
        const patientIds = [...new Set(doctorAppointments.map(a => a.patientId))];
        const doctorPatients = allPatientsData.filter(patient =>
          patientIds.includes(patient.uid)
        );
        
        // Get recent patients (added in the past week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentPatients = allPatientsData.filter(patient =>
          patient.createdAt >= oneWeekAgo
        );
        
        // Combine doctor's patients with recent patients
        const combinedPatients = [...new Set([...doctorPatients, ...recentPatients])];

        setAppointments(doctorAppointments);
        setPatients(combinedPatients);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Helper function to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Filter today's appointments
  const todayAppointments = appointments.filter(apt =>
    isToday(apt.date) && apt.status === 'scheduled'
  );
  
  // Filter upcoming appointments (future dates, not today)
  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(apt.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate > today && apt.status === 'scheduled';
  });

  // Get appointments for this month
  const thisMonthAppointments = appointments.filter(a => {
    const today = new Date();
    return a.date.getMonth() === today.getMonth() &&
           a.date.getFullYear() === today.getFullYear();
  });

  // Sort patients by creation date (most recent first)
  const sortedPatients = [...patients].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Get recent patients (past week)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentPatients = sortedPatients.filter(patient =>
    patient.createdAt >= oneWeekAgo
  );

  const stats = [
    { title: 'Total Patients', value: patients.length, icon: Users, color: 'bg-blue-500' },
    { title: 'Today\'s Appointments', value: todayAppointments.length, icon: Calendar, color: 'bg-green-500' },
    { title: 'Upcoming', value: upcomingAppointments.length, icon: Clock, color: 'bg-orange-500' },
    { title: 'This Month', value: thisMonthAppointments.length, icon: TrendingUp, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
        <button
          onClick={() => navigate('/doctor/reports')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Appointments</h2>
        {todayAppointments.length > 0 ? (
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{appointment.patientName}</p>
                    <p className="text-sm text-gray-600">{appointment.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    appointment.status === 'scheduled' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status}
                  </span>
                  <button
                    onClick={() => navigate('/doctor/appointments')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No appointments today</p>
        )}
      </div>

      {/* Recent Patients */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Patients (Past Week)</h2>
        {recentPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPatients.slice(0, 6).map((patient) => (
              <div key={patient.uid} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{patient.name}</p>
                    <p className="text-sm text-gray-600">{patient.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/doctor/reports')}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  View History
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No patients found</p>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;