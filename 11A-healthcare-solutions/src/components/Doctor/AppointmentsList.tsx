import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, Plus } from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment } from '../../types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const normalizeDate = (d: any): Date => {
  if (!d) return new Date();
  if (d.toDate) return d.toDate(); // Firestore Timestamp
  return new Date(d);
};

const AppointmentsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportForm, setReportForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    symptoms: '',
    treatmentPlan: '',
    followUpDate: ''
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser) return;

      try {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('doctorId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(appointmentsQuery);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];

        const sorted = data.sort((a, b) => normalizeDate(b.date).getTime() - normalizeDate(a.date).getTime());
        setAppointments(sorted);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUser]);

  // ✅ Filtering logic fixed
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointments.filter(a => {
    const date = normalizeDate(a.date);
    return date >= today && date < tomorrow;
  });

  const upcomingAppointments = appointments.filter(a => {
    const date = normalizeDate(a.date);
    return date >= tomorrow && a.status === 'scheduled';
  });

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status,
        updatedAt: new Date()
      });
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, status: status as any } : a))
      );
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleCreateReport = async () => {
    if (!currentUser || !selectedAppointment) return;

    try {
      const report = {
        patientId: selectedAppointment.patientId,
        doctorId: currentUser.uid,
        appointmentId: selectedAppointment.id,
        patientName: selectedAppointment.patientName,
        doctorName: selectedAppointment.doctorName,
        diagnosis: reportForm.diagnosis,
        prescription: reportForm.prescription,
        notes: reportForm.notes,
        symptoms: reportForm.symptoms || selectedAppointment.symptoms,
        treatmentPlan: reportForm.treatmentPlan,
        followUpDate: reportForm.followUpDate
          ? new Date(reportForm.followUpDate)
          : null,
        reportType: 'consultation',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'medicalReports'), report);
      await handleStatusUpdate(selectedAppointment.id, 'completed');

      alert('Report created!');
      setShowReportForm(false);
      setSelectedAppointment(null);
      setReportForm({
        diagnosis: '',
        prescription: '',
        notes: '',
        symptoms: '',
        treatmentPlan: '',
        followUpDate: ''
      });
    } catch (err) {
      alert('Failed to create report');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage your patient appointments.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Today's Appointments" count={todayAppointments.length} icon={<Calendar className="w-8 h-8 text-blue-600" />} />
        <StatCard title="Upcoming" count={upcomingAppointments.length} icon={<Clock className="w-8 h-8 text-orange-600" />} />
        <StatCard title="Completed" count={appointments.filter(a => a.status === 'completed').length} icon={<CheckCircle className="w-8 h-8 text-green-600" />} />
        <StatCard title="Total" count={appointments.length} icon={<User className="w-8 h-8 text-purple-600" />} />
      </div>

      <div className="space-y-8">
        {todayAppointments.length > 0 && (
          <AppointmentSection
            title="Today's Appointments"
            data={todayAppointments}
            onSelect={setSelectedAppointment}
            onShowReport={setShowReportForm}
            onSetForm={setReportForm}
            onStatusChange={handleStatusUpdate}
          />
        )}
        {upcomingAppointments.length > 0 && (
          <AppointmentSection
            title="Upcoming Appointments"
            data={upcomingAppointments}
            onSelect={setSelectedAppointment}
            onShowReport={setShowReportForm}
            onSetForm={setReportForm}
            onStatusChange={handleStatusUpdate}
          />
        )}
        <AppointmentSection
          title="All Appointments"
          data={appointments}
          onSelect={setSelectedAppointment}
          onShowReport={setShowReportForm}
          onSetForm={setReportForm}
          onStatusChange={handleStatusUpdate}
        />
      </div>

      {showReportForm && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Report</h2>
                <p className="text-sm text-gray-500">For {selectedAppointment.patientName}</p>
              </div>
              <button onClick={() => setShowReportForm(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div className="space-y-6">
              {['symptoms', 'diagnosis', 'prescription', 'treatmentPlan', 'notes'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('Plan', ' Plan')}</label>
                  <textarea
                    rows={field === 'symptoms' || field === 'notes' ? 3 : 2}
                    value={(reportForm as any)[field]}
                    onChange={(e) => setReportForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={reportForm.followUpDate}
                  onChange={(e) => setReportForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setShowReportForm(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={!reportForm.diagnosis || !reportForm.prescription}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card
const StatCard = ({ title, count, icon }: { title: string, count: number, icon: JSX.Element }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
    </div>
    <div className="bg-blue-50 p-3 rounded-full">
      {icon}
    </div>
  </div>
);

// Appointment Section
const AppointmentSection = ({ title, data, onSelect, onShowReport, onSetForm, onStatusChange }: any) => (
  <div className="bg-white rounded-lg shadow-md">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="divide-y divide-gray-200">
      {data.length === 0 ? (
        <p className="p-6 text-gray-500">No appointments in this category.</p>
      ) : data.map((apt: Appointment) => (
        <div key={apt.id} className="p-6 hover:bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex-1 mb-4 md:mb-0">
              <p className="font-semibold text-gray-900">{apt.patientName}</p>
              <p className="text-sm text-gray-500">
                {normalizeDate(apt.date).toDateString()} at {apt.time}
              </p>
              {apt.symptoms && <p className="text-sm text-gray-600 mt-2">Symptoms: {apt.symptoms}</p>}
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(apt.status)}`}>
                {apt.status}
              </span>
              {apt.status === 'scheduled' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      onSelect(apt);
                      onSetForm((prev: any) => ({ ...prev, symptoms: apt.symptoms || '' }));
                      onShowReport(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                  >
                    <Plus className="w-4 h-4" /> Add Report
                  </button>
                  <button
                    onClick={() => onStatusChange(apt.id, 'completed')}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => onStatusChange(apt.id, 'cancelled')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AppointmentsList;
