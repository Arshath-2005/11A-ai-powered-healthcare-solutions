import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import SplashScreen from './components/SplashScreen';
import RoleSelector from './components/Auth/RoleSelector';
import LoginForm from './components/Auth/LoginForm';
import RegistrationForm from './components/Auth/RegistrationForm';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import PrivateRoute from './components/PrivateRoute';

import PatientDashboard from './components/Patient/Dashboard';
import PatientProfile from './components/Patient/Profile';
import PatientList from './components/Patient/PatientList';
import BookAppointment from './components/Patient/BookAppointment';
import AIChat from './components/Ai/AIChat';
import MedicalReportsPatient from './components/Patient/MedicalReportPatient';

import DoctorDashboard from './components/Doctor/Dashboard';
import DoctorList from './components/Doctor/DoctorList';
import DoctorReports from './components/Doctor/MedicalReports';
import AppointmentsList from './components/Doctor/AppointmentsList';
import DoctorProfile from './components/Doctor/DoctorProfile'; // ✅ Fixed import
import Analytics from './components/Doctor/Analytics';
import DoctorDocuments from './components/Doctor/Documents';

import AdminDashboard from './components/Admin/Dashboard';
import AdminDoctorSearch from './components/Admin/DoctorSearch';
import AddDoctor from './components/Admin/AddDoctor';
import AddPatient from './components/Admin/AddPatient';
import DataPopulator from './components/Admin/DataPopulator';
import AdminSettings from './components/Admin/Settings';
import AdminAppointmentsList from './components/Admin/AppointmentsList';
import NotificationDemo from './components/Admin/NotificationDemo';

const LoginFormWrapper: React.FC = () => {
  const { role } = useParams<{ role: 'patient' | 'doctor' | 'admin' }>();
  if (!role) return <Navigate to="/" />;
  return <LoginForm role={role} onSuccess={() => {}} />;
};

const RegistrationFormWrapper: React.FC = () => {
  const { role } = useParams<{ role: 'patient' | 'doctor' | 'admin' }>();
  if (!role) return <Navigate to="/" />;
  return <RegistrationForm role={role} onSuccess={() => {}} />;
};

const AppContent: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [showSplash, setShowSplash] = useState(sessionStorage.getItem('splashShown') !== 'true');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('splashShown', 'true');
      }, 3000);
  
      return () => clearTimeout(timer);
    }
  }, [showSplash]);
  
  // Handle sidebar visibility on resize
  useEffect(() => {
    const handleResize = () => {
      // On large screens (lg and above), we keep the sidebar visible via CSS
      // but we set the state to false so the overlay doesn't appear
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (showSplash) {
    return <SplashScreen />;
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login/:role" element={<LoginFormWrapper />} />
        <Route path="/register/:role" element={<RegistrationFormWrapper />} />
        <Route path="/" element={<RoleSelector />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4">
          <Routes>
            {/* Patient Routes */}
            <Route path="/patient" element={<PrivateRoute requiredRole="patient"><PatientDashboard /></PrivateRoute>} />
            <Route path="/patient/profile" element={<PrivateRoute requiredRole="patient"><PatientProfile /></PrivateRoute>} />
            <Route path="/patient/doctors" element={<PrivateRoute requiredRole="patient"><DoctorList /></PrivateRoute>} />
            <Route path="/patient/appointments" element={<PrivateRoute requiredRole="patient"><BookAppointment /></PrivateRoute>} />
            <Route path="/patient/chat" element={<PrivateRoute requiredRole="patient"><AIChat /></PrivateRoute>} />
            <Route path="/patient/medical-reports" element={<PrivateRoute requiredRole="patient"><MedicalReportsPatient /></PrivateRoute>} />

            {/* Doctor Routes */}
            <Route path="/doctor" element={<PrivateRoute requiredRole="doctor"><DoctorDashboard /></PrivateRoute>} />
            <Route path="/doctor/patients" element={<PrivateRoute requiredRole="doctor"><PatientList /></PrivateRoute>} />
            <Route path="/doctor/appointments" element={<PrivateRoute requiredRole="doctor"><AppointmentsList /></PrivateRoute>} />
            <Route path="/doctor/reports" element={<PrivateRoute requiredRole="doctor"><DoctorReports /></PrivateRoute>} />
            <Route path="/doctor/doctorprofile" element={<PrivateRoute requiredRole="doctor"><DoctorProfile /></PrivateRoute>} /> {/* ✅ Fixed route */}
            <Route path="/doctor/analytics" element={<PrivateRoute requiredRole="doctor"><Analytics /></PrivateRoute>} />
            <Route path="/doctor/documents" element={<PrivateRoute requiredRole="doctor"><DoctorDocuments /></PrivateRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/patients" element={<PrivateRoute requiredRole="admin"><PatientList /></PrivateRoute>} />
            <Route path="/admin/doctors" element={<PrivateRoute requiredRole="admin"><AdminDoctorSearch /></PrivateRoute>} />
            <Route path="/admin/add-doctor" element={<PrivateRoute requiredRole="admin"><AddDoctor /></PrivateRoute>} />
            <Route path="/admin/add-patient" element={<PrivateRoute requiredRole="admin"><AddPatient /></PrivateRoute>} />
            <Route path="/admin/populate-data" element={<PrivateRoute requiredRole="admin"><DataPopulator /></PrivateRoute>} />
            <Route path="/admin/settings" element={<PrivateRoute requiredRole="admin"><AdminSettings /></PrivateRoute>} />
            <Route path="/admin/appointments" element={<PrivateRoute requiredRole="admin"><AdminAppointmentsList /></PrivateRoute>} />
            <Route path="/admin/notifications" element={<PrivateRoute requiredRole="admin"><NotificationDemo /></PrivateRoute>} />
            <Route path="/admin/documents" element={<PrivateRoute requiredRole="admin"><DoctorDocuments /></PrivateRoute>} />
            <Route path="/admin/*" element={<PrivateRoute requiredRole="admin">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800">Feature Coming Soon</h2>
                <p className="text-gray-600 mt-2">This feature is under development.</p>
              </div>
            </PrivateRoute>} />

            {/* Default Redirects */}
            <Route path="/" element={<Navigate to={`/${userProfile.role}`} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
