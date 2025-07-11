import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Appointment, Doctor } from '../../types';

const AppointmentsList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch doctors
        const doctorsCollection = collection(db, 'users');
        const q = query(doctorsCollection, where('role', '==', 'doctor'));
        const doctorsSnapshot = await getDocs(q);
        const doctorsData = doctorsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            uid: doc.id,
            // Ensure all required fields from the Doctor type are present
            role: data.role || 'doctor',
            specialization: data.specialization || '',
            experience: data.experience || 0,
            qualification: data.qualification || '',
            consultationFee: data.consultationFee || 0,
            availableSlots: data.availableSlots || [],
            name: data.name || 'Unknown Doctor',
            email: data.email || '',
            createdAt: data.createdAt || new Date(),
          } as Doctor;
        });
        setDoctors(doctorsData);

        // Fetch appointments
        const appointmentsCollection = collection(db, 'appointments');
        const appointmentsSnapshot = await getDocs(appointmentsCollection);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            // Ensure all required fields from the Appointment type are present
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
        setAppointments(appointmentsData);

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const statusMatch = statusFilter ? appointment.status === statusFilter : true;
      const doctorMatch = doctorFilter ? appointment.doctorId === doctorFilter : true;
      return statusMatch && doctorMatch;
    });
  }, [appointments, statusFilter, doctorFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">All Appointments</h1>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 mb-1">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 mb-1">Filter by Doctor</label>
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">All Doctors</option>
            {doctors.map(doctor => (
              <option key={doctor.uid} value={doctor.uid}>{doctor.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <tr>
                <th className="py-3 px-6 text-left">Patient</th>
                <th className="py-3 px-6 text-left">Doctor</th>
                <th className="py-3 px-6 text-center">Date</th>
                <th className="py-3 px-6 text-center">Time</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {filteredAppointments.map(appointment => (
                <tr key={appointment.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{appointment.patientName}</td>
                  <td className="py-3 px-6 text-left">{appointment.doctorName}</td>
                  <td className="py-3 px-6 text-center">{new Date(appointment.date).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-center">{appointment.time}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={`py-1 px-3 rounded-full text-xs ${
                      appointment.status === 'scheduled' ? 'bg-yellow-200 text-yellow-800' :
                      appointment.status === 'completed' ? 'bg-green-200 text-green-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsList;