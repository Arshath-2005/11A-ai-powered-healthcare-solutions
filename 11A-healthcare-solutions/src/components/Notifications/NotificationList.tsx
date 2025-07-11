import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../types';

interface NotificationListProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'medical':
        return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'system':
        return <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'message':
        return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </div>;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 
        ? 'Just now' 
        : `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">Notifications</h3>
        <div className="flex space-x-2">
          <button 
            onClick={markAllAsRead}
            className="p-1 hover:bg-gray-100 rounded-full"
            title="Mark all as read"
          >
            <Check className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No notifications
        </div>
      ) : (
        <div>
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-start ${!notification.read ? 'bg-blue-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="mr-3 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <Trash2 className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList;