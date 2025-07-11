import React, { useState, useEffect } from 'react';
import { Calendar, MessageSquare, FileText, User, Activity, Clock } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, MedicalRecord } from '../../types';
import { useNavigate } from 'react-router-dom';


const PatientDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
   const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        // Fetch appointments without orderBy to avoid composite index requirement
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('patientId', '==', currentUser.uid)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        let appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];

        // Sort appointments by date in JavaScript instead of Firestore
        appointmentsData = appointmentsData
          .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5); // Limit to 5 most recent

        // Fetch medical records without orderBy to avoid composite index requirement
        const recordsQuery = query(
          collection(db, 'medicalRecords'),
          where('patientId', '==', currentUser.uid)
        );
        const recordsSnapshot = await getDocs(recordsQuery);
        let recordsData = recordsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MedicalRecord[];

        // Sort records by createdAt in JavaScript instead of Firestore
        recordsData = recordsData
          .sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5); // Limit to 5 most recent

        setAppointments(appointmentsData);
        setRecords(recordsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const stats = [
    { title: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'bg-blue-500' },
    { title: 'Medical Records', value: records.length, icon: FileText, color: 'bg-green-500' },
    { title: 'Upcoming', value: appointments.filter(a => a.status === 'scheduled').length, icon: Clock, color: 'bg-orange-500' },
    { title: 'Health Score', value: '85%', icon: Activity, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Patient Dashboard</h1>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div className="text-left" onClick={()=>{navigate("/patient/chat")}}>
              <p className="font-medium text-gray-800" >AI Health Assistant</p>
              <p className="text-sm text-gray-600">Get instant health advice</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <Calendar className="w-8 h-8 text-green-600" />
            <div className="text-left" onClick={()=>{navigate("/patient/appointments")}}>
              <p className="font-medium text-gray-800">Book Appointment</p>
              <p className="text-sm text-gray-600">Schedule with a doctor</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <FileText className="w-8 h-8 text-purple-600" />
            <div className="text-left" onClick={()=>{navigate("/patient/medical-reports")}}>
              <p className="font-medium text-gray-800">View Records</p>
              <p className="text-sm text-gray-600">Access medical history</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Appointments History</h2>
        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg mb-3">
                <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{appointment.doctorName}</p>
                    <p className="text-sm text-gray-600">
                      {appointment.date instanceof Date 
                        ? appointment.date.toDateString() 
                        : new Date(appointment.date).toDateString()
                      } at {appointment.time}
                    </p>
                  </div>
                </div>
                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-sm ${
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
          <p className="text-gray-500 text-center py-8">No appointments found</p>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;