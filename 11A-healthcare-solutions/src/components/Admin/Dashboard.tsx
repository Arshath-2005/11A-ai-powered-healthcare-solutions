import React, { useState, useEffect } from 'react';
import { Users, Stethoscope, Calendar, Activity, TrendingUp, Plus } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Doctor, Patient, Appointment } from '../../types';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch doctors
        const doctorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'doctor')
        );
        const doctorsSnapshot = await getDocs(doctorsQuery);
        const doctorsData = doctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as unknown as Doctor[];

        // Fetch patients
        const patientsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'patient')
        );
        const patientsSnapshot = await getDocs(patientsQuery);
        const patientsData = patientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as unknown as Patient[];

        // Fetch appointments
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          orderBy('date', 'desc')
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate?.() || new Date() // Safely convert Firestore Timestamp to JS Date
          };
        }) as Appointment[];

        setDoctors(doctorsData);
        setPatients(patientsData);
        setAppointments(appointmentsData);
      } catch (error: any) {
        console.error('🔥 Error fetching data:', error.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const today = new Date().toDateString();
  const todayAppointments = appointments.filter(apt =>
    apt.date.toDateString() === today
  );

  const thisMonthAppointments = appointments.filter(apt =>
    apt.date.getMonth() === new Date().getMonth() &&
    apt.date.getFullYear() === new Date().getFullYear()
  );

  const stats = [
    { title: 'Total Doctors', value: doctors.length, icon: Stethoscope, color: 'bg-blue-500' },
    { title: 'Total Patients', value: patients.length, icon: Users, color: 'bg-green-500' },
    { title: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: 'bg-orange-500' },
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
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={() => navigate('/admin/add-doctor')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Doctor</span>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Doctors</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/add-doctor')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add New Doctor
            </button>
            <button
              onClick={() => navigate('/admin/doctors')}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View All Doctors
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Patients</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/patients')}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Patients
            </button>
            <button
              onClick={() => navigate('/admin/patients')}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Patient Reports
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/doctor/analytics')}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Analytics
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              System Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {appointment.patientName} → {appointment.doctorName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.date.toDateString()} at {appointment.time}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  appointment.status === 'scheduled'
                    ? 'bg-green-100 text-green-800'
                    : appointment.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
            ))}
          </div>
          
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
