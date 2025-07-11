import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  File as FileIcon,
  Settings,
  Stethoscope,
  UserPlus,
  Activity,
  Database,
  Bell,
  X,
  Menu,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { userProfile, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };
  
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = useMemo(() => {
    switch (userProfile?.role) {
      case 'patient':
        return [
          { icon: Home, label: 'Dashboard', to: '/patient', end: true },
          { icon: Stethoscope, label: 'Doctors', to: '/patient/doctors' },
          { icon: Calendar, label: 'Book Appointment', to: '/patient/appointments' },
          { icon: MessageSquare, label: 'AI Assistant', to: '/patient/chat' },
          { icon: FileText, label: 'Medical Reports', to: '/patient/medical-reports' },
          { icon: Settings, label: 'Profile', to: '/patient/profile' },
        ];
      case 'doctor':
        return [
          { icon: Home, label: 'Dashboard', to: '/doctor', end: true },
          { icon: Users, label: 'Patients', to: '/doctor/patients' },
          { icon: Calendar, label: 'Appointments', to: '/doctor/appointments' },
          { icon: FileText, label: 'Medical Reports', to: '/doctor/reports' },
          { icon: FileIcon, label: 'Documents', to: '/doctor/documents' },
          { icon: Activity, label: 'Analytics', to: '/doctor/analytics' },
          { icon: Settings, label: 'Profile', to: '/doctor/doctorprofile' },
        ];
      case 'admin':
        return [
          { icon: Home, label: 'Dashboard', to: '/admin', end: true },
          { icon: Users, label: 'Patients', to: '/admin/patients' },
          { icon: Stethoscope, label: 'Doctors', to: '/admin/doctors' },
          { icon: UserPlus, label: 'Add Doctor', to: '/admin/add-doctor' },
          { icon: UserPlus, label: 'Add Patient', to: '/admin/add-patient' },
          { icon: Calendar, label: 'Appointments', to: '/admin/appointments' },
          { icon: FileIcon, label: 'Documents', to: '/admin/documents' },
          { icon: Bell, label: 'Notifications', to: '/admin/notifications' },
          { icon: Settings, label: 'Settings', to: '/admin/settings' },
        ];
      default:
        return [];
    }
  }, [userProfile?.role]);

  // Base classes for the sidebar
  const sidebarClasses = `bg-white shadow-lg h-screen transition-all duration-300 ease-in-out w-64 ${
    isMobile
      ? `fixed z-30 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`
      : ''
  }`;

  // Overlay for mobile view when sidebar is open
  const overlayClasses = `fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 lg:hidden ${
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`;

  return (
    <>
      {/* Overlay for mobile */}
      <div className={overlayClasses} onClick={toggleSidebar}></div>
      
      {/* Sidebar */}
      <div className={sidebarClasses}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-800">
              <span className="text-sm">11A</span><span className="text-blue-600 text-lg">+</span>
              <span className="text-xs tracking-tight ml-1" style={{fontSize:"20px"}}>Healthcare Solutions</span>
            </h1>
            <p className="text-xs text-gray-600 mt-1">Hospital Management</p>
          </div>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <nav className="mt-6 px-3 flex flex-col h-[calc(100%-8rem)]">
          <div className="flex-grow">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={isMobile ? toggleSidebar : undefined}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 mb-2 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium' : ''
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </div>
          
          {/* Logout button for mobile view */}
          {isMobile && (
            <div className="mt-auto mb-6 border-t border-gray-200 pt-4">
              <button
                onClick={handleLogoutClick}
                className="flex items-center w-full px-3 py-2 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
      
      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to log out of 11A<span className="text-blue-600">+</span>?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
