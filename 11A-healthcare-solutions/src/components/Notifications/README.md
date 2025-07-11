# Notification System

This directory contains components and utilities for the application's notification system. The notification system allows for real-time notifications to be displayed to users based on various events in the application.

## Components

### NotificationList

The `NotificationList` component displays a list of notifications in a dropdown menu when the notification bell icon in the navbar is clicked. It shows the notification title, message, and timestamp, and allows users to mark notifications as read or delete them.

## Usage

### Accessing Notifications in Components

To use notifications in your components, you can use the `useNotifications` hook from the NotificationContext:

```tsx
import { useNotifications } from '../../contexts/NotificationContext';

const MyComponent = () => {
  const { 
    notifications,     // List of all notifications for the current user
    unreadCount,       // Count of unread notifications
    markAsRead,        // Function to mark a notification as read
    markAllAsRead,     // Function to mark all notifications as read
    deleteNotification, // Function to delete a notification
    addNotification    // Function to add a new notification
  } = useNotifications();
  
  // Component logic
};
```

### Creating Notifications

There are several ways to create notifications:

1. **Using the NotificationContext directly:**

```tsx
const { addNotification } = useNotifications();
const { userProfile } = useAuth();

// Add a notification
await addNotification({
  userId: userProfile.uid,
  title: 'Notification Title',
  message: 'Notification message',
  type: 'system', // 'appointment', 'medical', 'system', or 'message'
  read: false,
  relatedId: 'optional-related-id',
  link: '/optional-link'
});
```

2. **Using the NotificationService:**

```tsx
import NotificationService from '../../services/NotificationService';

// Create a notification
await NotificationService.createNotification(
  userId,
  'Notification Title',
  'Notification message',
  'system', // 'appointment', 'medical', 'system', or 'message'
  'optional-related-id',
  '/optional-link'
);
```

3. **Using the notificationHelpers utility functions:**

```tsx
import { 
  notifyNewAppointment,
  notifyAppointmentStatusChange,
  notifyNewMedicalReport,
  notifyUsersByRole,
  notifyAdminsOfNewUser
} from '../../utils/notificationHelpers';

// Notify about a new appointment
await notifyNewAppointment(appointment, patientId, doctorId);

// Notify about an appointment status change
await notifyAppointmentStatusChange(appointment, patientId, previousStatus);

// Notify about a new medical report
await notifyNewMedicalReport(report, patientId);

// Notify all users of a specific role
await notifyUsersByRole(title, message, 'patient', users, '/patient');

// Notify admins about a new user
await notifyAdminsOfNewUser(newUser, adminIds);
```

4. **Using the useNotificationManager hook:**

```tsx
import useNotificationManager from '../../hooks/useNotificationManager';

const MyComponent = () => {
  const { 
    notifyCurrentUser,
    notifyAppointment,
    notifyAppointmentStatusChange,
    notifyMedicalReport
  } = useNotificationManager();
  
  // Notify the current user
  await notifyCurrentUser(
    'Notification Title',
    'Notification message',
    'system',
    'optional-related-id',
    '/optional-link'
  );
  
  // Notify about an appointment
  await notifyAppointment(appointment, isForDoctor);
  
  // Notify about an appointment status change
  await notifyAppointmentStatusChange(appointment, previousStatus);
  
  // Notify about a medical report
  await notifyMedicalReport(report);
};
```

## Notification Types

The system supports four types of notifications:

1. **appointment**: Notifications related to appointments (bookings, cancellations, reminders)
2. **medical**: Notifications related to medical reports and records
3. **system**: System notifications (announcements, updates, etc.)
4. **message**: Message notifications (chat messages, etc.)

Each type has a different icon in the notification list.

## Testing Notifications

The `NotificationDemo` component (accessible at `/admin/notifications`) allows administrators to test the notification system by sending custom notifications to different user roles or sending predefined test notifications.

## Implementation Details

The notification system is implemented using:

1. **Firebase Firestore**: Notifications are stored in the `notifications` collection in Firestore.
2. **React Context**: The `NotificationContext` provides access to notifications throughout the application.
3. **Real-time updates**: The system uses Firestore's real-time capabilities to update notifications in real-time.

## Notification Schema

Each notification has the following fields:

- `id`: Unique identifier for the notification
- `userId`: ID of the user the notification is for
- `title`: Notification title
- `message`: Notification message
- `type`: Type of notification ('appointment', 'medical', 'system', 'message')
- `read`: Whether the notification has been read
- `createdAt`: When the notification was created
- `relatedId`: Optional ID of a related entity (appointment, medical report, etc.)
- `link`: Optional link to navigate to when the notification is clicked