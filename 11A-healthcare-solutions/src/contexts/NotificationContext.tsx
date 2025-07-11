import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userProfile) return;

    // Subscribe to notifications for the current user
    // Using only where clause without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userProfile.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsList: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read,
          createdAt: data.createdAt.toDate(),
          relatedId: data.relatedId,
          link: data.link
        });
      });
      
      // Sort notifications by createdAt in descending order (newest first)
      // This replaces the Firestore orderBy that was causing the index error
      const sortedNotifications = notificationsList.sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications
        .filter(n => !n.read)
        .map(n => {
          const notificationRef = doc(db, 'notifications', n.id);
          return updateDoc(notificationRef, { read: true });
        });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      // Create notification data object with required fields
      const notificationData: any = {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: Timestamp.now()
      };
      
      // Only add optional fields if they are defined
      if (notification.relatedId !== undefined) {
        notificationData.relatedId = notification.relatedId;
      }
      
      if (notification.link !== undefined) {
        notificationData.link = notification.link;
      }
      
      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};