import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { notifyUsersByRole, notifyAdminsOfNewUser } from '../../utils/notificationHelpers';

const NotificationDemo: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList: User[] = [];
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const createdAt = userData.createdAt ?
            (userData.createdAt instanceof Date ?
              userData.createdAt :
              new Date(userData.createdAt.seconds * 1000)
            ) :
            new Date();
            
          usersList.push({
            ...userData,
            uid: doc.id,
            createdAt
          } as User);
        });
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await notifyUsersByRole(
        title,
        message,
        selectedRole,
        users,
        `/${selectedRole}`
      );
      
      // Also add a notification for the current user to demonstrate
      const adminUser = users.find(u => u.role === 'admin');
      if (adminUser) {
        await addNotification({
          userId: adminUser.uid,
          title,
          message,
          type: 'system',
          read: false,
          link: `/${selectedRole}`
          // Note: relatedId is intentionally omitted to avoid undefined values
        });
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reset form
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotifications = async () => {
    setLoading(true);
    
    try {
      // Get admin users
      const adminUsers = users.filter(user => user.role === 'admin');
      const adminIds = adminUsers.map(admin => admin.uid);
      
      // Send test notifications for different scenarios
      
      // 1. New user registration notification
      if (users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        await notifyAdminsOfNewUser(randomUser, adminIds);
      }
      
      // 2. System notification for all roles
      await notifyUsersByRole(
        'System Maintenance',
        'The system will be down for maintenance on Sunday from 2-4 AM',
        'patient',
        users,
        '/patient'
      );
      
      await notifyUsersByRole(
        'New Feature Available',
        'Check out the new analytics dashboard',
        'doctor',
        users,
        '/doctor/analytics'
      );
      
      await notifyUsersByRole(
        'Database Update',
        'User database has been updated',
        'admin',
        users,
        '/admin/settings'
      );
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending test notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Testing</h2>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Send Custom Notification</h3>
        
        <form onSubmit={handleSendNotification}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter notification title"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter notification message"
              rows={3}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'patient' | 'doctor' | 'admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Send Test Notifications</h3>
        <p className="text-gray-600 mb-4">
          This will send a variety of test notifications to demonstrate different notification types.
        </p>
        
        <button
          onClick={handleSendTestNotifications}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Test Notifications'}
        </button>
      </div>
      
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
          Notifications sent successfully!
        </div>
      )}
    </div>
  );
};

export default NotificationDemo;