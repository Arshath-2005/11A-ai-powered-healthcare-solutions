import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Menu, LogOut, AlertCircle, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationList from '../Notifications/NotificationList';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { userProfile, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userInfoRef = useRef<HTMLDivElement>(null);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserInfo) setShowUserInfo(false);
  };

  const toggleUserInfo = () => {
    setShowUserInfo(!showUserInfo);
    if (showNotifications) setShowNotifications(false);
  };
  
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

  // Handle clicks outside of user info dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userInfoRef.current && !userInfoRef.current.contains(event.target as Node)) {
        setShowUserInfo(false);
      }
    };

    if (showUserInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserInfo]);

  // Get profile path based on user role
  const getProfilePath = () => {
    switch (userProfile?.role) {
      case 'patient':
        return '/patient/profile';
      case 'doctor':
        return '/doctor/doctorprofile';
      case 'admin':
        return '/admin/settings';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle sidebar"
            aria-expanded={showNotifications}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="lg:hidden">
            <h1 className="text-lg font-bold text-gray-800">
              <span className="text-sm">11A</span><span className="text-blue-600 text-lg">+</span> <span className="text-xs tracking-tight">Healthcare</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationList
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>
          
          <div className="relative" ref={userInfoRef}>
            <button
              onClick={toggleUserInfo}
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              aria-label="User profile"
            >
              <User className="w-4 h-4 text-white" />
            </button>
            
            {/* User info dropdown - only visible when clicked */}
            {showUserInfo && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
                </div>
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500">{userProfile?.email}</p>
                </div>
                <div className="px-2 py-2 border-t border-gray-100">
                  <Link
                    to={getProfilePath()}
                    className="flex items-center w-full px-2 py-1.5 text-sm text-blue-600 rounded hover:bg-blue-50 transition-colors"
                    onClick={() => setShowUserInfo(false)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                     View Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Logout button in navbar for desktop view */}
          <div className="hidden lg:block">
            <button
              onClick={handleLogoutClick}
              className="flex items-center px-3 py-2 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
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
    </nav>
  );
};

export default Navbar;